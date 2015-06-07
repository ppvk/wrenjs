// Js interface to the interpret.c file
var newVM = Module.cwrap('newVM', 'void');
var freeVM = Module.cwrap('freeVM', 'void');
var interpret = Module.cwrap('interpret', 'void', ['string','string']);

var wrenSpawnEvent = function (type, content) {
    var event = new CustomEvent(type,{detail: content});
    document.dispatchEvent(event);
    console.log(event);
}

var testString = "test";
var testInt = 12345;
