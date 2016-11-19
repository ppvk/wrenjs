#include <string.h>
#include "wren.h"
#include "emscripten.h"

// Reusable WrenConfiguration object
WrenConfiguration config;

// Sets default settings for a new wren VM and returns a pointer for it.
// Uses function pointers generated from the JavaScript context
WrenVM* shimNewVM(
  WrenWriteFn shimWriteFn,
  WrenErrorFn shimErrorFn,
  WrenLoadModuleFn shimLoadModuleFn,
  WrenBindForeignMethodFn shimBindForeignMethodFn
) {
    wrenInitConfiguration(&config);
    config.writeFn = shimWriteFn;
    config.errorFn = shimErrorFn;
    config.loadModuleFn = shimLoadModuleFn;
    config.bindForeignMethodFn = shimBindForeignMethodFn;
    WrenVM* vm = wrenNewVM(&config);
    return vm;
}