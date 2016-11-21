
VM_MAP = {};

var shimWriteFn = function(vm, message) {
  VM_MAP[vm].config.writeFn(message);
}

var shimErrorFn = function(source_module, line, message) {
  console.warn(message + "\n  " + source_module + ":" + line);
}

var shimLoadModuleFn = function(vm, source_module) {
  return VM_MAP[vm].config.loadModuleFn(source_module);
}

var shimBindForeignMethodFn = function() {

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
  this.pointers = {};
  this.writeFn = console.log;
};

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

      return Runtime.addFunction(fn(source_module, className, isStatic, signature));
    };
    this.pointers.bindForeignMethodFn = bindForeignMethodFn;
  }
});

// WrenVM JavaScript 'class'
WrenVM = function(config) {
  this.config = config;
  this._vm = ccall('shimNewVM',
    'number',
    ['number'],[
      Runtime.addFunction(this.config.pointers.bindForeignMethodFn)
    ]
  );
  VM_MAP[this._vm] = this;
};

WrenVM.prototype.freeVM = function() {
  ccall('wrenFreeVM',
    null, ['number'],
    [this._vm]
  );
  VM_MAP[this._vm] = undefined;
  this._vm = undefined;
};

WrenVM.prototype.interpret = function(wren) {
  var code = ccall('wrenInterpret',
    'number', ['number', 'string'],
    [this._vm, wren]);
  // 0 is good
  return code;
}