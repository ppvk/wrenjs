/**
 * @overview
 * The wren programming language in your browser!
 * <br>
 *
 * @example
 * import * as Wren from "../out/wren.js";
 *
 * let vm = new Wren.VM({
 *   resolveModuleFn     : function(importer, name) {...},
 *   loadModuleFn        : function(name) {...},
 *   bindForeignMethodFn : function(moduleName, className, isStatic, signature) {...},
 *   bindForeignClassFn  : function(moduleName, className) {...},
 *   writeFn             : function(toLog) {...},
 *   errorFn             : function(errorType, moduleName, line, msg) {...}
 * });
 *
 * vm.interpret("main", `
 *   System.print("Hello from Wren!")
 * `);
 */

/**
 * wrenjs is an ES6 module.
 *
 * @example
 * import * as Wren from "./path/to/wren.js";
 *
 * @module Wren
 */

import libwren from './generated/libwren.js';

/*
* 'libwren' represents our connection to the Wren C API, through emscripten's ccall function.
* We attach an empty object to it so that we can store and lookup JS Wren.VMs from C and JS.
*/
var Module = libwren();
Module._VMs = {};
Module._values = [];

/**
* Get the current wren version number.
*
* Can be used to range checks over versions.
* @return {number} A monotonically increasing numeric representation of the
*                  version number.
*/
export function getVersionNumber() {
  let result = Module.ccall('wrenGetVersionNumber',
      'number',
      [], []
  );

  return result;
}


/**
* The type of error returned by the [VM].
* @property {number} COMPILE A syntax or resolution error detected at compile time.
* @property {number} RUNTIME The error message for a runtime error.
* @property {number} STACK_TRACE One entry of a runtime error's stack trace.
*/
export var ErrorType = {
  COMPILE:      0,
  RUNTIME:      1,
  STACK_TRACE:  2
}

/**
* The result of a VM interpreting wren source.
* @property {number} SUCCESS the VM interpreted the source without error.
* @property {number} COMPILE_ERROR the VM experienced a compile error.
* @property {number} RUNTIME_ERROR the VM experienced a runtime error.
*/
export var Result = {
  SUCCESS:        0,
  COMPILE_ERROR:  1,
  RUNTIME_ERROR:  2
}


/**
* A single virtual machine for executing Wren code.
*/
export class VM {

    /**
    * Creates a new Wren virtual machine using the given [configuration].
    * If [configuration] is undefined, uses a default
    * configuration.
    * @param {Object} configuration
    * an object containing any or all of the following properties:
    * resolveModuleFn, loadModuleFn, bindForeignMethodFn, bindForeignClassFn,
    * writeFn, errorFn.
    *
    * let vm = new Wren.VM({
    *   resolveModuleFn     : function(importer, name) {...},
    *   loadModuleFn        : function(name) {...},
    *   bindForeignMethodFn : function(moduleName, className, isStatic, signature) {...},
    *   bindForeignClassFn  : function(moduleName, className) {...},
    *   writeFn             : function(toLog) {...},
    *   errorFn             : function(errorType, moduleName, line, msg) {...}
    * });
    */
    constructor(config) {
        // Replaces wrenInitConfiguration
        let default_config = {
            resolveModuleFn     : VM.defaultResolveModuleFn,
            loadModuleFn        : VM.defaultLoadModuleFn,
            bindForeignMethodFn : VM.defaultBindForeignMethodFn,
            bindForeignClassFn  : VM.defaultBindForeignClassFn,
            writeFn             : VM.defaultWriteFn,
            errorFn             : VM.defaultErrorFn
        }
        this.config = Object.assign(default_config, config);

        this._pointer = Module.ccall('shimNewVM',
          'number',
          [],[]
        );

        Module._VMs[this._pointer] = this;

        this._foreignClasses = {};
    }

    // Defaults //
    static defaultResolveModuleFn(importer, name) {
        return name;
    }

    static defaultLoadModuleFn(name) {
        return null;
    }

    static defaultBindForeignMethodFn(moduleName, className, isStatic, signature) {
        return null;
    }

    static defaultBindForeignClassFn(moduleName, className) {
        return null;
    }

    static defaultWriteFn(toLog) {
        let str = 'WRENJS: ';
        console.log(str + toLog);
    }

    static defaultErrorFn(errorType, moduleName, line, msg) {
        let str = 'WRENJS: ';
        if (errorType == 0) {
          console.warn(
              str + "["+moduleName+" line " +line+ "] [Error] "+msg+"\n"
          );
        }
        if (errorType == 1) {
          console.warn(
              str + "["+moduleName+" line "+line+"] in "+msg+"\n"
          );
        }
        if (errorType == 2) {
          console.warn(
              str + "[Runtime Error] "+msg+"\n"
          );
        }
    }

    /*
    * The following methods are called from C, and should not be relied upon in
    * the JS context.
    * --------------------------------------------------------------------------
    */

    _resolveModuleFn(importer, name) {
        return this.config.resolveModuleFn(importer, name);
    }

    _loadModuleFn(name) {
        return this.config.loadModuleFn(name);
    }

    _bindForeignMethod(moduleName, className, isStatic, signature) {
        // This should return a function looking for a Wren.VM as its only arg.
        let method = this.config.bindForeignMethodFn(moduleName, className,
          isStatic, signature
        );

        if (method == null) {
          return null;
        }

        // The wren C api expects a function looking for a pointer as its arg.
        let vm = this;
        let wrappedMethod = function(pointer) {
          method(vm);
        }
        return wrappedMethod;
    }

    _bindForeignClass(moduleName, className) {
        var methods =  this.config.bindForeignClassFn(moduleName, className);

        if (methods == null) {
          return null;
        }

        // Similar to the bindForeignMethod fn above, C expects to pass these
        // a pointer to the VM, and we need to convert that to a JS Wren.VM
        let vm = this;

        return {
            allocate: function() {
                methods.allocate(vm);
            },
            finalize: function() {
                methods.finalize(vm);

                let pointer = Module.ccall('wrenGetSlotForeign',
                  'number',
                  ['number', 'number'],
                  [vm._pointer, 0]
                );

                delete vm._foreignClasses[pointer];
            }
        }
    }

    _write(text) {
        this.config.writeFn(text);
    }

    _error(errorType, moduleName, line, msg) {
        this.config.errorFn(errorType, moduleName, line, msg);
    }

    /*
    * The following methods are implementations of the Wren C API, callable
    * from the JS context.
    * --------------------------------------------------------------------------
    */

    /**
    * Disposes of all resources in use by the VM.
    */
    free() {
        Module.ccall('wrenFreeVM',
          null,
          ['number'],
          [this._pointer]
        );
        delete VM[this._pointer]
        this._pointer = undefined;
    }

    /**
    * Immediately run the garbage collector to free unused memory.
    */
    collectGarbage() {
        Module.ccall('wrenCollectGarbage',
          null,
          ['number'],
          [this._pointer]
        );
    }

    /**
    * Runs [source], a string of Wren source code in a new fiber in [vm] in the
    * context of resolved [moduleName].
    * @return {string} whether the result was a success or an error.
    * @param {string} moduleName the name of the wren module.
    * @param {string} src the wren source code to interpret
    */
    interpret(moduleName, src) {
        let result = Module.ccall('wrenInterpret',
            'number',
            ['number', 'string', 'string'],
            [this._pointer, moduleName, src]);

        return result;
    }

    /**
    * Creates a handle that can be used to invoke a method with [signature] on
    * using a receiver and arguments that are set up on the stack.
    *
    * This handle can be used repeatedly to directly invoke that method from JS
    * code using [call].
    *
    * When you are done with this handle, it must be released using
    * [releaseHandle].
    * @return {number} a handle for use with [VM.call].
    * @param {string} signature a string depicting the signature of a wren method.
    */
    makeCallHandle(signature) {
        let handle = Module.ccall('wrenMakeCallHandle',
          'number',
          ['number', 'string'],
          [this._pointer, signature]
        );
        return handle;
    }

    /**
    * Calls [method], using the receiver and arguments previously set up on the
    * stack.
    *
    * [method] must have been created by a call to [makeCallHandle]. The
    * arguments to the method must be already on the stack. The receiver should be
    * in slot 0 with the remaining arguments following it, in order. It is an
    * error if the number of arguments provided does not match the method's
    * signature.
    *
    * After this returns, you can access the return value from slot 0 on the stack.
    * @return {string} whether the result was a success or error.
    * @param {number} method the handle returned from makeCallHandle.
    */
    call(method) {
        let result = Module.ccall('wrenCall',
          'number',
          ['number', 'number'],
          [this._pointer, method]
        );

        return result;
    }

    /**
    * Releases the reference stored in [handle]. After calling this, [handle] can
    * no longer be used.
    * @param {number} handle the handle returned from makeCallHandle.
    */
    releaseHandle(handle) {
        Module.ccall('wrenReleaseHandle',
          null,
          ['number', 'number'],
          [this._pointer, 'handle']
        );
    }

    /**
    * Returns the number of slots available to the current foreign method.
    * @return {number} the number of slots.
    */
    getSlotCount() {
        let count = Module.ccall('wrenGetSlotCount',
          'number',
          ['number'],
          [this._pointer]
        );
        return count;
    }

    /**
    * Ensures that the foreign method stack has at least [numSlots] available for
    * use, growing the stack if needed.
    *
    * Does not shrink the stack if it has more than enough slots.
    *
    * It is an error to call this from a finalizer.
    * @param {number} numSlots the number of slots needed.
    */
    ensureSlots(numSlots) {
        Module.ccall('wrenEnsureSlots',
          null,
          ['number', 'number'],
          [this._pointer, numSlots]
        );
    }

    /**
    * Gets the type of the object in [slot].
    * @return {string} the type of the object.
    * @param {number} slot the index of the slot.
    */
    getSlotType(slot) {
        let t = Module.ccall('wrenGetSlotType',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );

        let types = [
          'WREN_TYPE_BOOL',
          'WREN_TYPE_NUM',
          'WREN_TYPE_FOREIGN',
          'WREN_TYPE_LIST',
          'WREN_TYPE_MAP',
          'WREN_TYPE_NULL',
          'WREN_TYPE_STRING',
          'WREN_TYPE_UNKNOWN'
        ]; // TODO: pull out into an enum.

        return types[t];
    }

    /**
    * Reads a boolean value from [slot].
    *
    * It is an error to call this if the slot does not contain a boolean value.
    * @return {boolean} the value stored in the slot.
    * @param {number} slot the index of the slot.
    */
    getSlotBool(slot) {
        let boolean = Module.ccall('wrenGetSlotBool',
          'boolean',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return boolean;
    }

    /**
    * Reads a byte array from [slot].
    *
    * The memory for the returned string is owned by Wren. You can inspect it
    * while in your foreign method, but cannot keep a pointer to it after the
    * function returns, since the garbage collector may reclaim it.
    *
    * Returns a pointer to the first byte of the array and fill [length] with the
    * number of bytes in the array. TODO: does it?
    *
    * It is an error to call this if the slot does not contain a string.
    * @return {string} the bytes as a string.
    * @param {number} slot the index of the slot.
    * @param {number} length the length of the bytes.
    */
    getSlotBytes(slot, length) {
        let bytes = Module.ccall('wrenGetSlotBytes',
          'string',
          ['number', 'number', 'number'],
          [this._pointer, slot, length]
        );
        return bytes;
    }

    /**
    * Reads a number from [slot].
    *
    * It is an error to call this if the slot does not contain a number.
    * @return {number} the value stored in the slot.
    * @param {number} slot the index of the slot.
    */
    getSlotDouble(slot) {
        let double = Module.ccall('wrenGetSlotDouble',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return double;
    }

    /**
    * Reads a foreign object from [slot] and returns a pointer to the foreign data
    * stored with it.
    *
    * It is an error to call this if the slot does not contain an instance of a
    * foreign class.
    * @return {Object} the JavaScript Object stored in the slot.
    * @param {number} slot the index of the slot.
    */
    getSlotForeign(slot) {
        let pointer = Module.ccall('wrenGetSlotForeign',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );

        return this._foreignClasses[pointer];
    }

    /**
    * Reads a string from [slot].
    *
    * The memory for the returned string is owned by Wren. You can inspect it
    * while in your foreign method, but cannot keep a pointer to it after the
    * function returns, since the garbage collector may reclaim it.
    * TODO: Is it?
    *
    * It is an error to call this if the slot does not contain a string.
    * @return {string} the string stored in the slot.
    * @param {number} slot the index of the slot.
    */
    getSlotString(slot) {
        let string = Module.ccall('wrenGetSlotString',
          'string',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return string;
    }

    /**
    * Creates a handle for the value stored in [slot].
    *
    * This will prevent the object that is referred to from being garbage collected
    * until the handle is released by calling [releaseHandle()].
    * @return {number} a handle for use with [VM.call].
    * @param {number} slot the index of the slot.
    */
    getSlotHandle(slot) {
        let handle = Module.ccall('wrenGetSlotHandle',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return handle;
    }

    /**
    * Stores the boolean [value] in [slot].
    * @param {number} slot the index of the slot.
    * @param {boolean} value the boolean to store.
    */
    setSlotBool(slot, value) {
        Module.ccall('wrenSetSlotBool',
          null,
          ['number', 'number', 'boolean'],
          [this._pointer, slot, value]
        );
    }

    /**
    * Stores the array [length] of [bytes] in [slot].
    *
    * The bytes are copied to a new string within Wren's heap, so you can free
    * memory used by them after this is called.
    * @param {number} slot the index of the slot.
    * @param {string} bytes the bytes to store.
    * @param {number} length the length of the bytes.
    */
    setSlotBytes(slot, bytes, length) {
        Module.ccall('wrenSetSlotBytes',
          null,
          ['number', 'number', 'string', 'number'],
          [this._pointer, slot, bytes, length]
        );
    }

    /**
    * Stores the numeric [value] in [slot].
    * @param {number} slot the index of the slot.
    * @param {number} value the value to store.
    */
    setSlotDouble(slot, value) {
        Module.ccall('wrenSetSlotDouble',
          null,
          ['number', 'number', 'number'],
          [this._pointer, slot, value]
        );
    }

    /**
    * Creates a new instance of the foreign class stored in [classSlot] with [size]
    * bytes of raw storage and places the resulting object in [slot].
    *
    * This does not invoke the foreign class's constructor on the new instance. If
    * you need that to happen, call the constructor from Wren, which will then
    * call the allocator foreign method. In there, call this to create the object
    * and then the constructor will be invoked when the allocator returns.
    *
    * @return {Object} the same foreignObject you passed in.
    * @param {number} slot the index of the slot.
    * @param {number} classSlot the slot containing the foreign class.
    * @param {Object} foreignObject a JavaScript class.
    */
    setSlotNewForeign(slot, classSlot, foreignObject) {
        let pointer = Module.ccall('wrenSetSlotNewForeign',
          'number',
          ['number', 'number', 'number', 'number'],
          [this._pointer, slot, classSlot, 0]
        );

        this._foreignClasses[pointer] = foreignObject;

        return foreignObject;
    }

    /**
    * Stores a new empty list in [slot].
    * @param {number} slot the index of the slot.
    */
    setSlotNewList(slot) {
        Module.ccall('wrenSetSlotNewList',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    /**
    * Stores a new empty map in [slot].
    * @param {number} slot the index of the slot.
    */
    setSlotNewMap(slot) {
        Module.ccall('wrenSetSlotNewMap',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    /**
    * Stores null in [slot].
    * @param {number} slot the index of the slot.
    */
    setSlotNull(slot) {
        Module.ccall('wrenSetSlotNull',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    /**
    * Stores the string [text] in [slot].
    *
    * The [text] is copied to a new string within Wren's heap, so you can free
    * memory used by it after this is called. The length is calculated using
    * [strlen()]. If the string may contain any null bytes in the middle, then you
    * should use [setSlotBytes()] instead.
    * @param {number} slot the index of the slot.
    * @param {string} text the string to store.
    */
    setSlotString(slot, text) {
        Module.ccall('wrenSetSlotString',
          null,
          ['number', 'number', 'string'],
          [this._pointer, slot, text]
        );
    }

    /**
    * Stores the value captured in [handle] in [slot].
    *
    * This does not release the handle for the value.
    * @param {number} slot the index of the slot.
    * @param {number} handle a handle returned from makeCallHandle.
    */
    setSlotHandle(slot, handle) {
        Module.ccall('wrenSetSlotHandle',
          null,
          ['number', 'number', 'number'],
          [this._pointer, slot, handle]
        );
    }

    /**
    * Returns the number of elements in the list stored in [slot].
    * @return {number} the number of elements in the list.
    * @param {number} slot the index of the slot.
    */
    getListCount(slot) {
        let count = Module.ccall('wrenGetListCount',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return count;
    }

    /**
    * Reads element [index] from the list in [listSlot] and stores it in
    * [elementSlot].
    * @param {number} listSlot
    * @param {number} index
    * @param {number} elementSlot
    */
    getListElement(listSlot, index, elementSlot) {
        Module.ccall('wrenGetListElement',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    /**
    * Sets the value stored at [index] in the list at [listSlot],
    * to the value from [elementSlot].
    * @param {number} listSlot
    * @param {number} index
    * @param {number} elementSlot
    */
    setListElement(listSlot, index, elementSlot) {
        Module.ccall('wrenSetListElement',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    /**
    * Takes the value stored at [elementSlot] and inserts it into the list stored
    * at [listSlot] at [index].
    *
    * As in Wren, negative indexes can be used to insert from the end. To append
    * an element, use `-1` for the index.
    * @param {number} listSlot
    * @param {number} index
    * @param {number} elementSlot
    */
    insertInList(listSlot, index, elementSlot) {
        Module.ccall('wrenInsertInList',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    /**
    * Returns the number of entries in the map stored in [slot].
    * @return {number} the number of entries in the map.
    * @param {number} slot the index of the slot.
    */
    getMapCount(slot) {
        let count = Module.ccall('wrenGetMapCount',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return count;
    }

    /**
    * Returns true if the key in [keySlot] is found in the map placed in [mapSlot].
    * @return {boolean} whether the map contains the key.
    * @param {number} mapSlot a slot containing the map.
    * @param {number} keySlot a slot containing the key.
    */
    getMapContainsKey(mapSlot, keySlot) {
        let boolean = Module.ccall('wrenGetMapContainsKey',
          'boolean',
          ['number', 'number', 'number'],
          [this._pointer, mapSlot, keySlot]
        );
        return boolean;
    }

    /**
    * Retrieves a value with the key in [keySlot] from the map in [mapSlot] and
    * stores it in [valueSlot].
    * @param {number} mapSlot a slot containing the map.
    * @param {number} keySlot a slot containing the key.
    * @param {number} valueSlot a slot to place the value.
    */
    getMapValue(mapSlot, keySlot, valueSlot) {
        Module.ccall('wrenGetMapValue',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, mapSlot, keySlot, valueSlot]
        );
    }

    /**
    * Takes the value stored at [valueSlot] and inserts it into the map stored
    * at [mapSlot] with key [keySlot].
    * @param {number} mapSlot a slot containing the map.
    * @param {number} keySlot a slot containing the key to add.
    * @param {number} valueSlot a slot containing the key's value.
    */
    setMapValue(mapSlot, keySlot, valueSlot) {
        Module.ccall('wrenSetMapValue',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, mapSlot, keySlot, valueSlot]
        );
    }

    /**
    * Removes a value from the map in [mapSlot], with the key from [keySlot],
    * and place it in [removedValueSlot]. If not found, [removedValueSlot] is
    * set to null, the same behaviour as the Wren Map API.
    * @param {number} mapSlot a slot containing the map.
    * @param {number} keySlot a slot containing the key to remove.
    * @param {number} removedValueSlot a slot to contain the removed value.
    */
    removeMapValue(mapSlot, keySlot, removedValueSlot) {
        Module.ccall('wrenRemoveMapValue',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, mapSlot, keySlot, removedValueSlot]
        );
    }

    /**
    * Looks up the top level variable with [name] in resolved [moduleName] and stores
    * it in [slot].
    * @param {string} moduleName the name of the wren moduleName.
    * @param {string} name the name of the variable.
    * @param {number} slot the index of the slot.
    */
    getVariable(moduleName, name, slot) {
        Module.ccall('wrenGetVariable',
          null,
          ['number', 'string', 'string', 'number'],
          [this._pointer, moduleName, name, slot]
        );
    }

    /**
    * Looks up the top level variable with [name] in resolved [moduleName],
    * returns false if not found. The module must be imported at the time,
    * use wrenHasModule to ensure that before calling.
    * @return {boolean} whether the variable exists in module.
    * @param {string} moduleName the name of the wren module.
    * @param {string} name the name of the variable.
    */
    hasVariable(moduleName, name) {
        let boolean = Module.ccall('wrenHasVariable',
          'boolean',
          ['number', 'string', 'string'],
          [this._pointer, moduleName, name]
        );
        return boolean;
    }

    /**
    * Returns true if [moduleName] has been imported/resolved before, false if not.
    * @return {boolean} whether the module has been imported/resolved before.
    * @param {string} moduleName the name of the wren module.
    */
    hasModule(moduleName) {
        let boolean = Module.ccall('wrenHasModule',
          'boolean',
          ['number', 'string'],
          [this._pointer, moduleName]
        );
        return boolean;
    }

    /**
    * Sets the current fiber to be aborted, and uses the value in [slot] as the
    * runtime error object.
    * @param {number} slot the index of the slot.
    */
    abortFiber(slot) {
        Module.ccall('wrenAbortFiber',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    // The following APIs are not implemented.
    //getUserData() {}
    //setUserData(userData) {}
}
