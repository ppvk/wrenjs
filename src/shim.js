// Define a series of default functions for the default Wren configuration

// default function for a resolveModuleFn is to just return the name given.
function defaultResolveModuleFn(importer, name) {
    return name;
}

function defaultLoadModuleFn(name) {
    return null;
}

function defaultBindForeignMethodFn(module, className, isStatic, signature) {
    return null;
}

function defaultBindForeignClassFn(module, className) {
    return null;
}

function defaultWriteFn(toLog) {
    let str = 'WRENJS:\n';
    console.log(str + toLog);
}

function defaultErrorFn(errorType, module, line, msg) {
    let str = 'WRENJS:\n';
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

class VM {
    constructor(config) {
        let default_config = {
            resolveModuleFn     : defaultResolveModuleFn,
            loadModuleFn        : defaultLoadModuleFn,
            bindForeignMethodFn : defaultBindForeignMethodFn,
            writeFn             : defaultWriteFn,
            errorFn             : defaultErrorFn
        }
        this.config = Object.assign(default_config, config);

        this._pointer = Module.ccall('shimNewVM',
          'number',
          [],[]
        );

        VM[this._pointer] = this;
    }

    loadModule(name) {
        return this.config.loadModuleFn(name);
    }

    bindForeignMethod(module, className, isStatic, signature) {
        return this.config.bindForeignMethodFn(module, className, isStatic, signature);
    }

    write(text) {
        this.config.writeFn(text);
    }

    error(errorType, module, line, msg) {
        this.config.errorFn(errorType, module, line, msg);
    }

    free() {
        Module.ccall('wrenFreeVM',
          null,
          ['number'],
          [this._pointer]
        );
        delete VM[this._pointer]
        this._pointer = undefined;
    }

    collectGarbage() {
        Module.ccall('wrenCollectGarbage',
          null,
          ['number'],
          [this._pointer]
        );
    }

    interpret(module, src) {
        let result = Module.ccall('wrenInterpret',
          'number',
          ['number', 'string', 'string'],
          [this._pointer, module, src]);
        return result;
    }

    makeCallHandle(signature) {
        let handle = Module.ccall('wrenMakeCallHandle',
          'number',
          ['number', 'string'],
          [this._pointer, signature]
        );
        return handle;
    }

    call(method) {
        let result = Module.ccall('wrenCall',
          'number',
          ['number', 'number'],
          [this._pointer, method]
        );
        return result;
    }

    releaseHandle(handle) {
        Module.ccall('wrenReleaseHandle',
          null,
          ['number', 'number'],
          [this._pointer, 'handle']
        );
    }

    getSlotCount() {
        let count = Module.ccall('wrenGetSlotCount',
          'number',
          ['number'],
          [this._pointer]
        );
        return count;
    }

    ensureSlots(numSlots) {
        Module.ccall('wrenEnsureSlots',
          null,
          ['number', 'number'],
          [this._pointer, numSlots]
        );
    }

    getSlotType(slot) {
        let type = Module.ccall('wrenGetSlotType',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return type;
    }

    getSlotBool(slot) {
        let boolean = Module.ccall('wrenGetSlotBool',
          'boolean',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return boolean;
    }

    getSlotBytes(slot, length) {
        let bytes = Module.ccall('wrenGetSlotBytes',
          'string',
          ['number', 'number', 'number'],
          [this._pointer, slot, length]
        );
        return bytes;
    }

    getSlotDouble(slot) {
        let double = Module.ccall('wrenGetSlotDouble',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return double;
    }

    wrenGetSlotForeign(slot) {
        let pointer = Module.ccall('wrenGetSlotForeign',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return pointer;
    }

    getSlotString(slot) {
        let string = Module.ccall('wrenGetSlotString',
          'string',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return string;
    }

    getSlotHandle(slot) {
        let handle = Module.ccall('wrenGetSlotHandle',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return handle;
    }

    setSlotBool(slot, value) {
        Module.ccall('wrenSetSlotBool',
          null,
          ['number', 'number', 'boolean'],
          [this._pointer, slot, value]
        );
    }

    setSlotBytes(slot, bytes, length) {
        Module.ccall('wrenSetSlotBytes',
          null,
          ['number', 'number', 'string', 'number'],
          [this._pointer, slot, bytes, length]
        );
    }

    setSlotDouble(slot, value) {
        Module.ccall('wrenSetSlotDouble',
          null,
          ['number', 'number', 'number'],
          [this._pointer, slot, value]
        );
    }

    setSlotNewForeign(slot, classSlot, size) {
        let pointer = Module.ccall('wrenSetSlotNewForeign',
          'number',
          ['number', 'number', 'number', 'number'],
          [this._pointer, slot, classSlot, size]
        );
        return pointer;
    }

    setSlotNewList(slot) {
        Module.ccall('wrenSetSlotNewList',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    setSlotNull(slot) {
        Module.ccall('wrenSetSlotNull',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    setSlotString(slot, text) {
        Module.ccall('wrenSetSlotString',
          null,
          ['number', 'number', 'string'],
          [this._pointer, slot, text]
        );
    }

    setSlotHandle(slot, handle) {
        Module.ccall('wrenSetSlotHandle',
          null,
          ['number', 'number', 'number'],
          [this._pointer, slot, handle]
        );
    }

    getListCount(slot) {
        let count = Module.ccall('wrenGetListCount',
          'number',
          ['number', 'number'],
          [this._pointer, slot]
        );
        return count;
    }

    getListElement(listSlot, index, elementSlot) {
        Module.ccall('wrenGetListElement',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    insertInList(listSlot, index, elementSlot) {
        Module.ccall('wrenInsertInList',
          null,
          ['number', 'number', 'number', 'number'],
          [this._pointer, listSlot, index, elementSlot]
        );
    }

    getVariable(module, name, slot) {
        let variable = Module.ccall('wrenGetVariable',
          null,
          ['number', 'string', 'string', 'number'],
          [this._pointer, module, name, slot]
        );
    }

    abortFiber(slot) {
        Module.ccall('wrenAbortFiber',
          null,
          ['number', 'number'],
          [this._pointer, slot]
        );
    }

    getUserData() {
        let data = Module.ccall('wrenGetUserData',
          null,
          ['number'],
          [this._pointer]
        );
        return data
    }

    setUserData(userData) {
        Module.ccall('wrenSetUserData',
          null,
          ['number', 'number'],
          [this._pointer, userData]
        );
    }
}
Wren.VM = VM;
