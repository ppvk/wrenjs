import Module from './generated/libwren.js';
import {Configuration} from './configuration.js';

// Emscripten expects us to wait for the Module to be ready, but it's so darn
// fast that we can just load it like so and call it good.
let C;
Module().then( function(context) {
    C = context;
})

export class VM {
    constructor(config) {
        let default_config = {
            resolveModuleFn     : Configuration.defaultResolveModuleFn,
            loadModuleFn        : Configuration.defaultLoadModuleFn,
            bindForeignMethodFn : Configuration.defaultBindForeignMethodFn,
            bindForeignClassFn  : Configuration.defaultBindForeignClassFn,
            writeFn             : Configuration.defaultWriteFn,
            errorFn             : Configuration.defaultErrorFn
        }
        this.config = Object.assign(default_config, config);

        this._pointer = C.ccall('shimNewVM',
          'number',
          [],[]
        );

        VM[this._pointer] = this;

        this._foreignClasses = {};
    }

    loadModule(name) {
        return this.config.loadModuleFn(name);
    }

    bindForeignMethod(module, className, isStatic, signature) {
        let method = this.config.bindForeignMethodFn(this, module, className, isStatic, signature);

        // This is the function we pass back to C.
        // C will pass this a pointer for the wren VM, and we need to get the
        // JS version to the JS function.
        let vm = this;
        return function(_) {
            method(vm);
        }
    }

    bindForeignClass(module, className) {
        var methods =  this.config.bindForeignClassFn(this, module, className);

        // Similar to the bindForeignMethod fn above, C expects to pass these
        // a pointer to the VM, and we need to convert that to a JS Wren.VM
        let vm = this;
        return {
            allocate: function(_) {
                methods.allocate(vm);
            },
            finalize: function(_) {
                methods.finalize(vm);

                let pointer = C.ccall('wrenGetSlotForeign',
                  'number',
                  ['number', 'number'],
                  [this._pointer, 0]
                );

                delete this._foreignClasses[pointer];
            }
        }
    }

    write(text) {
        this.config.writeFn(text);
    }

    error(errorType, module, line, msg) {
        this.config.errorFn(errorType, module, line, msg);
    }

    free() {
        C.ccall('wrenFreeVM',
          null,
          ['number'],
          [this._pointer]
        );
        delete VM[this._pointer]
        this._pointer = undefined;
    }

    collectGarbage() {
        C.ccall('wrenCollectGarbage',
          null,
          ['number'],
          [this._pointer]
        );
    }

    interpret(module, src) {
        let result = C.ccall('wrenInterpret',
            'number',
            ['number', 'string', 'string'],
            [this._pointer, module, src]);

        return result;
    }

    makeCallHandle(signature) {
        let handle = C.ccall('wrenMakeCallHandle',
          'number',
          ['number', 'string'],
          [this._pointer, signature]
        );
        return handle;
    }

    call(method) {
        let result = C.ccall('wrenCall',
          'number',
          ['number', 'number'],
          [this._pointer, method]
        );
        return result;
    }

    releaseHandle(handle) {
        C.ccall('wrenReleaseHandle',
          null,
          ['number', 'number'],
          [this._pointer, 'handle']
        );
    }

    getSlotCount() {
        let count = C.ccall('wrenGetSlotCount',
          'number',
          ['number'],
          [this._pointer]
        );
        return count;
    }

    ensureSlots(numSlots) {
        C.ccall('wrenEnsureSlots',
          null,
          ['number', 'number'],
          [this._pointer, numSlots]
        );
    }

    getSlotType(slot) {
        let type = C.ccall('wrenGetSlotType',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return type;
    }

    getSlotBool(slot) {
        let boolean = C.ccall('wrenGetSlotBool',
          'boolean',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return boolean;
    }

    getSlotBytes(slot, length) {
        let bytes = C.ccall('wrenGetSlotBytes',
          'string',
          ['number', 'number', 'number'],
          [this._pointer, slot, length]
        );
        return bytes;
    }

    getSlotDouble(slot) {
        let double = C.ccall('wrenGetSlotDouble',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return double;
    }

    getSlotForeign(slot) {
        let pointer = C.ccall('wrenGetSlotForeign',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );

        return this._foreignClasses[pointer];
    }

    getSlotString(slot) {
        let string = C.ccall('wrenGetSlotString',
          'string',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return string;
    }

    getSlotHandle(slot) {
        let handle = C.ccall('wrenGetSlotHandle',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return handle;
    }

    setSlotBool(slot, value) {
        C.ccall('wrenSetSlotBool',
          null,
          ['number', 'number', 'boolean'],
          [this._pointer, slot, value]
        );
    }

    setSlotBytes(slot, bytes, length) {
        C.ccall('wrenSetSlotBytes',
          null,
          ['number', 'number', 'string', 'number'],
          [this._pointer, slot, bytes, length]
        );
    }

    setSlotDouble(slot, value) {
        C.ccall('wrenSetSlotDouble',
          null,
          ['number', 'number', 'number'],
          [this._pointer, slot, value]
        );
    }

    setSlotNewForeign(slot, classSlot, foreignObject) {
        let pointer = C.ccall('wrenSetSlotNewForeign',
          'number',
          ['number', 'number', 'number', 'number'],
          [this._pointer, slot, classSlot, 0]
        );

        this._foreignClasses[pointer] = foreignObject;

        return foreignObject;
    }

    setSlotNewList(slot) {
        C.ccall('wrenSetSlotNewList',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    setSlotNull(slot) {
        C.ccall('wrenSetSlotNull',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    setSlotString(slot, text) {
        C.ccall('wrenSetSlotString',
          null,
          ['number', 'number', 'string'],
          [this._pointer, slot, text]
        );
    }

    setSlotHandle(slot, handle) {
        C.ccall('wrenSetSlotHandle',
          null,
          ['number', 'number', 'number'],
          [this._pointer, slot, handle]
        );
    }

    getListCount(slot) {
        let count = C.ccall('wrenGetListCount',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return count;
    }

    getListElement(listSlot, index, elementSlot) {
        C.ccall('wrenGetListElement',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    insertInList(listSlot, index, elementSlot) {
        C.ccall('wrenInsertInList',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    getVariable(module, name, slot) {
        let variable = C.ccall('wrenGetVariable',
          null,
          ['number', 'string', 'string', 'number'],
          [this._pointer, module, name, slot]
        );
    }

    abortFiber(slot) {
        C.ccall('wrenAbortFiber',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }
}
