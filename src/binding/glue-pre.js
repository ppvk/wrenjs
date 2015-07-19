var Wren = new Object();
(function() {
  var Module = new Object();

  Wren.WREN_OBJECTS = new Object();
  // initial id
  var i = 0;

  Wren.lookup = function(id) {
    return Wren.WREN_OBJECTS[id];
  }

  Wren.register = function(object) {
    Wren.WREN_OBJECTS[i] = object;
    i++;
    return i - 1;
  }

  Wren.free = function(id) {
    Wren.WREN_OBJECTS[id] = null;
  }

  Wren.call = function(object) {
    Wren.lookup[object]();
  }
  Wren.callMethod = function(object, method) {
    Wren.lookup[object]();
  }

// Pre - Emscripten //
