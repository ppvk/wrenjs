#include <string.h>
#include "emscripten.h"
#include "wren.h"

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
static void shimErrorFn(WrenVM* vm, WrenErrorType type, const char* module, int line, const char* message) {
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "shimErrorFn(\"%s\", %d ,\"%s\")",module, line, message);
    emscripten_run_script(buffer);
}
char* shimLoadModuleFn(WrenVM* vm, const char* module) {
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "shimLoadModuleFn(%p, \"%s\")", vm, module);
    return emscripten_run_script_string(buffer);
}

void jsCall(WrenVM* vm) {
  const char* string = wrenGetSlotString(vm, 1);
  const char* returnType = wrenGetSlotString(vm, 2);

  if (strcmp(returnType, "void") == 0) {
    emscripten_run_script(string);
  };

  if (strcmp(returnType, "string") == 0) {
    wrenSetSlotString(vm, 0, emscripten_run_script_string(string));
  };

  if (strcmp(returnType, "number") == 0) {
    double d;
    sscanf(emscripten_run_script_string(string), "%lf", &d);
    wrenSetSlotDouble(vm, 0, d);
  };

  if (strcmp(returnType, "boolean") == 0) {
    const char* test = emscripten_run_script_string(string);
    if (strcmp(test, "true") == 0) {
        wrenSetSlotBool(vm, 0, true);
    } else {
        wrenSetSlotBool(vm, 0, false);
    }
  };
}

WrenForeignMethodFn shimBindForeignMethodFn(
  WrenVM* vm,
  const char* module,
  const char* className,
  bool isStatic,
  const char* signature)
{
  if (strcmp(className, "JS") == 0 && strcmp(signature, "call(_,_)") == 0) return jsCall;
  return NULL;
}

// Sets default settings for a new wren VM and returns a pointer for it.
WrenVM* shimNewVM() {
  wrenInitConfiguration(&config);
  config.writeFn = shimWriteFn;
  config.errorFn = shimErrorFn;
  config.loadModuleFn = shimLoadModuleFn;
  config.bindForeignMethodFn = shimBindForeignMethodFn;
  WrenVM* vm = wrenNewVM(&config);
  return vm;
}
