#include <string.h>
#include "wren.h"
#include "emscripten.h"

// Reusable WrenConfiguration object
WrenConfiguration config;

static void shimWriteFn(WrenVM* vm, const char* toLog) {
    if (strcmp(toLog, "\n") == 0) {
        return;
    }
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "shimWriteFn(%p, \"%s\")", vm, toLog);
    emscripten_run_script(buffer);
}

static void shimErrorFn(WrenErrorType type, const char* module, int line, const char* message) {
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "shimErrorFn(\"%s\", %d ,\"%s\")",module, line, message);
    emscripten_run_script(buffer);
}

char* shimLoadModuleFn(WrenVM* vm, const char* module) {
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "shimLoadModuleFn(%p, \"%s\")", vm, module);
    return emscripten_run_script_string(buffer);
}

/*
WrenForeignMethodFn shimBindForeignMethodFn(
  WrenVM* vm,
  const char* module,
  const char* className,
  bool isStatic,
  const char* signature)
{

  //Do Some Magic Here

  return NULL;
}
*/

// Sets default settings for a new wren VM and returns a pointer for it.
// Uses function pointers generated from the JavaScript context
WrenVM* shimNewVM(
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