/**
 * @module Wren
 */

import libwren from './generated/libwren.js';

/*
* 'libwren' represents our connection to the Wren C API, through emscripten's ccall function.
* We attach an empty object to it so that we can store and lookup JS Wren.VMs from C and JS.
*/
var Module = libwren();
Module._VMs = {};

/**
* Get the current wren version number.
*
* Can be used to range checks over versions.
* @return {number}
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
* Configuration for a [VM].
*/
export class Configuration {

    // Defaults //
    static defaultResolveModuleFn(importer, name) {
        return name;
    }

    static defaultLoadModuleFn(name) {
        return null;
    }

    static defaultBindForeignMethodFn(vm, module, className, isStatic, signature) {
        return null;
    }

    static defaultBindForeignClassFn(vm, module, className) {
        return null;
    }

    static defaultWriteFn(toLog) {
        let str = 'WRENJS: ';
        console.log(str + toLog);
    }

    static defaultErrorFn(errorType, module, line, msg) {
        let str = 'WRENJS: ';
        if (errorType == 0) {
          console.warn(
              str + "["+module+" line " +line+ "] [Error] "+msg+"\n"
          );
        }
        if (errorType == 1) {
          console.warn(
              str + "["+module+" line "+line+"] in "+msg+"\n"
          );
        }
        if (errorType == 2) {
          console.warn(
              str + "[Runtime Error] "+msg+"\n"
          );
        }
    }
}

/**
* A single virtual machine for executing Wren code.
*
* Wren has no global state, so all state stored by a running interpreter lives here.
*/
export class VM {

    /**
    * Creates a new Wren virtual machine using the given [configuration]. Wren
    * will copy the configuration data, so the argument passed to this can be
    * freed after calling this. If [configuration] is undefined, uses a default
    * configuration.
    * @param {Object} configuration
    * an object containing any or all of the following properties:
    * resolveModuleFn, loadModuleFn, bindForeignMethodFn, bindForeignClassFn,
    * writeFn, errorFn
    */
    constructor(config) {
        // Replaces wrenInitConfiguration
        let default_config = {
            resolveModuleFn     : Configuration.defaultResolveModuleFn,
            loadModuleFn        : Configuration.defaultLoadModuleFn,
            bindForeignMethodFn : Configuration.defaultBindForeignMethodFn,
            bindForeignClassFn  : Configuration.defaultBindForeignClassFn,
            writeFn             : Configuration.defaultWriteFn,
            errorFn             : Configuration.defaultErrorFn
        }
        this.config = Object.assign(default_config, config);

        this._pointer = Module.ccall('shimNewVM',
          'number',
          [],[]
        );

        Module._VMs[this._pointer] = this;

        this._foreignClasses = {};
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

    _bindForeignMethod(module, className, isStatic, signature) {
        let method = this.config.bindForeignMethodFn(this, module, className,
          isStatic, signature
        );

        // This is the function we pass back to Module.
        // C will pass this a pointer for the wren VM, and we need to get the
        // JS version to the JS function.
        let vm = this;
        return method;
    }

    _bindForeignClass(module, className) {
        var methods =  this.config.bindForeignClassFn(this, module, className);

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
                  [this._pointer, 0]
                );

                delete this._foreignClasses[pointer];
            }
        }
    }

    _write(text) {
        this.config.writeFn(text);
    }

    _error(errorType, module, line, msg) {
        this.config.errorFn(errorType, module, line, msg);
    }

    /*
    * The following methods are implementations of the Wren C API, callable
    * from the JS context.
    * --------------------------------------------------------------------------
    */

    /**
    * Disposes of all resources is use by the VM.
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
    * context of resolved [module].
    * @return {string} whether the result was a success or error.
    * @param {string} module
    * @param {string} src
    */
    interpret(module, src) {
        let r = Module.ccall('wrenInterpret',
            'number',
            ['number', 'string', 'string'],
            [this._pointer, module, src]);

        let results = [
          'WREN_RESULT_SUCCESS',
          'WREN_RESULT_COMPILE_ERROR',
          'WREN_RESULT_RUNTIME_ERROR'
        ];

        return results[r];
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
    * @param {string} signature
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
    * @param {number} method
    */
    call(method) {
        let r = Module.ccall('wrenCall',
          'number',
          ['number', 'number'],
          [this._pointer, method]
        );

        let results = [
          'WREN_RESULT_SUCCESS',
          'WREN_RESULT_COMPILE_ERROR',
          'WREN_RESULT_RUNTIME_ERROR'
        ]; // TODO: Pull out into an enum.

        return results[r];
    }

    /**
    * Releases the reference stored in [handle]. After calling this, [handle] can
    * no longer be used.
    * @param {number} handle
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
    * @param {number} numSlots
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
    * @param {number} slot
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
    * @return {boolean}
    * @param {number} slot
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
    * @param {number} slot
    * @param {number} length
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
    * @return {number}
    * @param {number} slot
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
    * @return {Object}
    * @param {number} slot
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
    * @return {string}
    * @param {number} slot
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
    * @param {number} slot
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
    * @param {number} slot
    * @param {boolean} value
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
    * @param {number} slot
    * @param {string} bytes
    * @param {number} length
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
    * @param {number} slot
    * @param {number} value
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
    * Returns a pointer to the foreign object's data. TODO: false.
    * @return {Object} the same foreignObject you passed in.
    * @param {number} slot
    * @param {number} classSlot
    * @param {Object} foreignObject
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
    * @param {number} slot
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
    * @param {number} slot
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
    * @param {number} slot
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
    * @param {number} slot
    * @param {string} text
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
    * @param {number} slot
    * @param {number} handle
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
    * @return {number}
    * @param {number} slot
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
    * @return {number}
    * @param {number} slot
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
    * @return {boolean}
    * @param {number} mapSlot
    * @param {number} keySlot
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
    * @param {number} mapSlot
    * @param {number} keySlot
    * @param {number} valueSlot
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
    * @param {number} mapSlot
    * @param {number} keySlot
    * @param {number} valueSlot
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
    * @param {number} mapSlot
    * @param {number} keySlot
    * @param {number} removedValueSlot
    */
    removeMapValue(mapSlot, keySlot, removedValueSlot) {
        Module.ccall('wrenRemoveMapValue',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, mapSlot, keySlot, removedValueSlot]
        );
    }

    /**
    * Looks up the top level variable with [name] in resolved [module] and stores
    * it in [slot].
    * @param {string} module`
    * @param {string} name
    * @param {number} slot
    */
    getVariable(module, name, slot) {
        Module.ccall('wrenGetVariable',
          null,
          ['number', 'string', 'string', 'number'],
          [this._pointer, module, name, slot]
        );
    }

    /**
    * Looks up the top level variable with [name] in resolved [module],
    * returns false if not found. The module must be imported at the time,
    * use wrenHasModule to ensure that before calling.
    * @return {boolean}
    * @param {string} module`
    * @param {string} name
    */
    hasVariable(module, name) {
        let boolean = Module.ccall('wrenHasVariable',
          'boolean',
          ['number', 'string', 'string'],
          [this._pointer, module, name]
        );
        return boolean;
    }

    /**
    * Returns true if [module] has been imported/resolved before, false if not.
    * @return {boolean}
    * @param {string} module`
    */
    hasModule(module) {
        let boolean = Module.ccall('wrenHasModule',
          'boolean',
          ['number', 'string'],
          [this._pointer, module]
        );
        return boolean;
    }

    /**
    * Sets the current fiber to be aborted, and uses the value in [slot] as the
    * runtime error object.
    * @param {number} slot
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
