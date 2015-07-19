// Post- Emscripten //
  // Js interface to the wren_js.c file, added to the Wren objects
  Wren.newVM = Module.cwrap('newVM', 'void');
  Wren.freeVM = Module.cwrap('freeVM', 'void');
  Wren.interpret = Module.cwrap('interpret', 'void', ['string', 'string']);
})();
