// Js interface to the interpret.c file
var newVM = Module.cwrap('newVM', 'void');
var freeVM = Module.cwrap('freeVM', 'void');
var interpret = Module.cwrap('interpret', 'void', ['string','string']);
