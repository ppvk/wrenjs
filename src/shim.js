
var Wren = {
    WREN_OBJECTS: {},
    CURRENT_INDEX: 1,
    VM_MAP: {},

    shimNewVM: Module.cwrap('shimNewVM', 'number',
      ['number', 'number', 'number', 'number']
    ),
    shimFreeVM: Module.cwrap('wrenFreeVM', null, ['number']),
    shimInterpret: Module.cwrap('wrenInterpret', 'number', ['number', 'string']),

    // The following functions are intended to be called from foreign methods or
    // finalizers. The interface Wren provides to a foreign method is like a
    // register machine: you are given a numbered array of slots that values can be
    // read from and written to. Values always live in a slot (unless explicitly
    // captured using wrenGetSlotHandle(), which ensures the garbage collector can
    // find them.
    wrenGetSlotCount: cwrap('wrenGetSlotCount', 'number', ['number']),
    wrenEnsureSlots: cwrap('wrenEnsureSlots', null, ['number', 'number']),
    //wrenGetSlotType: cwrap('wrenGetSlotType', 'number', [number]), TODO WrenType
    wrenGetSlotBool: cwrap('wrenGetSlotBool', 'number', ['number', 'number']),
    //wrenGetSlotBytes: cwrap('wrenGetSlotBytes', 'string', ['number', 'number', 'number']),
    wrenGetSlotDouble: cwrap('wrenGetSlotDouble', 'number', ['number', 'number']),
    //wrenGetSlotForeign: cwrap('wrenGetSlotForeign', 'number', ['number', 'number']),
    wrenGetSlotString: cwrap('wrenGetSlotString', 'string', ['number', 'number']),
    //wrenGetSlotHandle: cwrap('wrenGetSlotHandle', 'number', ['number', 'number']), TODO WrenHandle
    wrenSetSlotBool: cwrap('wrenSetSlotBool', null, ['number', 'number', 'number']),
    //wrenSetSlotBytes: cwrap('wrenSetSlotBytes', null, ['number', 'number', 'string', 'number']),
    wrenSetSlotDouble: cwrap('wrenSetSlotDouble', null, ['number', 'number', 'number']),
    //wrenSetSlotNewForeign: cwrap('wrenSetSlotNewForeign', null, ['number', 'number', 'number', 'number']),
    wrenSetSlotNewList: cwrap('wrenSetSlotNewList', null, ['number', 'number']),
    wrenSetSlotNull: cwrap('wrenSetSlotNull', null, ['number', 'number']),
    wrenSetSlotString: cwrap('wrenSetSlotString', null, ['number', 'number', 'string']),
    //wrenSetSlotHandle: cwrap('wrenSetSlotHandle', null, ['number', 'number', 'number']), TODO WrenHandle
};

WrenConfiguration = function() {

  var jsRun =  Runtime.addFunction(function(_vm) {
    var string = Wren.wrenGetSlotString(_vm, 1);
    eval(string);
  });

  var jsRun_string =  Runtime.addFunction(function(_vm) {
    var string = Wren.wrenGetSlotString(_vm, 1);
    Wren.wrenSetSlotString(_vm, 0, eval(string).toString())
  });

  var jsRun_num =  Runtime.addFunction(function(_vm) {
    var string = Wren.wrenGetSlotString(_vm, 1);
    Wren.wrenSetSlotDouble(_vm, 0, eval(string))
  });

  var jsRun_bool =  Runtime.addFunction(function(_vm) {
    var string = Wren.wrenGetSlotString(_vm, 1);
    var test = eval(string).toString();
    if (test === 'true') {
      Wren.wrenSetSlotBool(_vm, 0, 1)
    } else {
      Wren.wrenSetSlotBool(_vm, 0, 0)
    }
  });

  this.pointers = {
    errorFn: null,
    writeFn: null,
    loadModuleFn: null,
    bindForeignMethodFn: Runtime.addFunction(function(
      _vm,
      source_module,
      className,
      isStatic,
      signature
    ) {
      source_module = Module.Pointer_stringify(source_module);
      className = Module.Pointer_stringify(className);
      signature = Module.Pointer_stringify(signature);

      if (className === "JS" && signature === "run_(_)") return jsRun;
      if (className === "JS" && signature === "string_(_)") return jsRun_string;
      if (className === "JS" && signature === "num_(_)") return jsRun_num;
      if (className === "JS" && signature === "bool_(_)") return jsRun_bool;
      return null;
    })
  };
};

Object.defineProperty(WrenConfiguration.prototype, 'errorFn', {
  set: function(fn) {
    var errorFnPointer = Runtime.addFunction(function(type, source_module, line, message) {
      source_module = Module.Pointer_stringify(source_module);
      message = Module.Pointer_stringify(message);
      fn(source_module, line, message);
    });
    this.pointers.errorFn = errorFnPointer;
  }
});

Object.defineProperty(WrenConfiguration.prototype, 'writeFn', {
  set: function(fn) {
    var writeFnPointer = Runtime.addFunction(function(vm, message) {
      message = Module.Pointer_stringify(message);
      fn(message);
    });
    this.pointers.writeFn = writeFnPointer;
  }
});

Object.defineProperty(WrenConfiguration.prototype, 'loadModuleFn', {
  set: function(fn) {
    var loadModuleFnPointer = Runtime.addFunction(function(vm, module_name) {
      module_name = Module.Pointer_stringify(module_name);
      return Module.allocate(
        Module.intArrayFromString(fn(module_name)),
        'i8',
        Module.ALLOC_NORMAL
      )
    });
    this.pointers.loadModuleFn = loadModuleFnPointer;
  }
});












WrenVM = function(config) {
    this._vm = Wren.shimNewVM(
      config.pointers.writeFn,
      config.pointers.errorFn,
      config.pointers.loadModuleFn,
      config.pointers.bindForeignMethodFn
    );
    Wren.VM_MAP[this._vm] = this;
};

WrenVM.prototype.freeVM = function() {
    Wren.shimFreeVM(this._vm);
    Wren.VM_MAP[this._vm] = undefined;
};

WrenVM.prototype.interpret = function(wren) {
    var code = Wren.shimInterpret(this._vm, wren);
    // 0 is good
    return code;
}

WrenVM._lookup = function(id) {
    return Wren.WREN_OBJECTS[id];
};

WrenVM._register = function(object) {
  for (var index in Wren.WREN_OBJECTS) {
    if (Wren.WREN_OBJECTS[index] === object)
    return index;
  }

  Wren.WREN_OBJECTS[Wren.CURRENT_INDEX] = object;
  Wren.CURRENT_INDEX++;
  return Wren.CURRENT_INDEX - 1;
};

WrenVM._free = function(id) {
    Wren.WREN_OBJECTS[id] = null;
};
