
// Keeps track of each WrenVM created, indexed by pointer.
// The following 'shim' functions look up the WrenVM using the c pointer
// and calls the corresponding function in its config.
// This mimics the wren C api.
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


// WrenConfiguration JavaScript 'class'
WrenConfiguration = function() {
  this.writeFn = console.log;
};

// WrenVM JavaScript 'class'
WrenVM = function(config) {
  this.config = config;
  this._vm = ccall('shimNewVM',
    'number',
    [],[]
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
  // TODO, replace with an ENUM
  return code;
}

var Wren = {
  WREN_OBJECTS : {},
  CURRENT_INDEX : 1,
};

// Static Methods
WrenVM._lookup = function(id) {
    return Wren.WREN_OBJECTS[id];
};
WrenVM._register = function(object) { for (var index in Wren.WREN_OBJECTS) {
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