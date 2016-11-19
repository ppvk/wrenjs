
//Function Pointer tracking
Runtime.addFunction2 = function(x) {
  fcount++;
  return Runtime.addFunction(x);
}

Runtime.removeFunction2 = function(x) {
  fcount--;
  return Runtime.removeFunction(x);
}

Wren = {
    // The following functions are intended to be called from foreign methods or
    // finalizers. The interface Wren provides to a foreign method is like a
    // register machine: you are given a numbered array of slots that values can be
    // read from and written to. Values always live in a slot (unless explicitly
    // captured using wrenGetSlotHandle(), which ensures the garbage collector can
    // find them.
    // TODO Change these to functions that utilize ccall,
    // makes sure the the embedder doesn't start messing with pointers
    getSlotCount: cwrap('wrenGetSlotCount', 'number', ['number']),
    ensureSlots: cwrap('wrenEnsureSlots', null, ['number', 'number']),
    //getSlotType: cwrap('wrenGetSlotType', 'number', [number]), TODO WrenType
    getSlotBool: cwrap('wrenGetSlotBool', 'number', ['number', 'number']),
    //getSlotBytes: cwrap('wrenGetSlotBytes', 'string', ['number', 'number', 'number']),
    getSlotDouble: cwrap('wrenGetSlotDouble', 'number', ['number', 'number']),
    //getSlotForeign: cwrap('wrenGetSlotForeign', 'number', ['number', 'number']),
    getSlotString: cwrap('wrenGetSlotString', 'string', ['number', 'number']),
    //getSlotHandle: cwrap('wrenGetSlotHandle', 'number', ['number', 'number']), TODO WrenHandle
    setSlotBool: cwrap('wrenSetSlotBool', null, ['number', 'number', 'number']),
    //setSlotBytes: cwrap('wrenSetSlotBytes', null, ['number', 'number', 'string', 'number']),
    setSlotDouble: cwrap('wrenSetSlotDouble', null, ['number', 'number', 'number']),
    //setSlotNewForeign: cwrap('wrenSetSlotNewForeign', null, ['number', 'number', 'number', 'number']),
    setSlotNewList: cwrap('wrenSetSlotNewList', null, ['number', 'number']),
    setSlotNull: cwrap('wrenSetSlotNull', null, ['number', 'number']),
    setSlotString: cwrap('wrenSetSlotString', null, ['number', 'number', 'string']),
    //setSlotHandle: cwrap('wrenSetSlotHandle', null, ['number', 'number', 'number']), TODO WrenHandle
};

WrenConfiguration = function() {
  this.pointers = {
    errorFn: null,
    writeFn: null,
    loadModuleFn: null,
    bindForeignMethodFn: null
  };
};

Object.defineProperty(WrenConfiguration.prototype, 'errorFn', {
  set: function(fn) {
    var errorFn = function(type, source_module, line, message) {
      source_module = Pointer_stringify(source_module);
      message = Pointer_stringify(message);
      fn(source_module, line, message);
    };
    this.pointers.errorFn = errorFn;
  }
});

Object.defineProperty(WrenConfiguration.prototype, 'writeFn', {
  set: function(fn) {
    var writeFn = function(vm, message) {
      message = Pointer_stringify(message);
      fn(message);
    };
    this.pointers.writeFn = writeFn;
  }
});

Object.defineProperty(WrenConfiguration.prototype, 'loadModuleFn', {
  set: function(fn) {
    var loadModuleFn = function(vm, module_name) {
      module_name = Pointer_stringify(module_name);
      // the wrenVM will deallocate this for us later.
      return allocate(
        intArrayFromString(fn(module_name)),
        'i8',
        ALLOC_NORMAL
      )
    };
    this.pointers.loadModuleFn = loadModuleFn;
  }
});

Object.defineProperty(WrenConfiguration.prototype, 'bindForeignMethodFn', {
  set: function(fn) {
    var bindForeignMethodFn = function(
      _vm,
      source_module,
      className,
      isStatic,
      signature
    )
    {
      source_module = Pointer_stringify(source_module);
      className = Pointer_stringify(className);
      signature = Pointer_stringify(signature);

      return Runtime.addFunction2(fn(source_module, className, isStatic, signature));
    };
    this.pointers.bindForeignMethodFn = bindForeignMethodFn;
  }
});

// WrenVM JavaScript 'class'
// Uses up 4 of our Function Pointers
WrenVM = function(config) {
  this._vm = ccall('shimNewVM',
    'number',
    ['number', 'number', 'number', 'number'],
    [
      // TODO, deallocate these function pointers when VM is freed
      Runtime.addFunction2(config.pointers.writeFn),
      Runtime.addFunction2(config.pointers.errorFn),
      Runtime.addFunction2(config.pointers.loadModuleFn),
      Runtime.addFunction2(config.pointers.bindForeignMethodFn)
    ]
  );
  console.log(fcount);
};

WrenVM.prototype.freeVM = function() {
  ccall('wrenFreeVM',
    null, ['number'],
    [this._vm]
  );
};

WrenVM.prototype.interpret = function(wren) {
  var code = ccall('wrenInterpret',
    'number', ['number', 'string'],
    [this._vm, wren]);
  // 0 is good
  return code;
}