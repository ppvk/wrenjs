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
    return wrenNewVM(&config);
}


//// VARIABLE TYPE SHIMS ////
/*
// Runs the string in javascript with eval(), returns nothing
void jsRun(WrenVM* vm) {
    const char* string = wrenGetSlotString(vm, 1);
    emscripten_run_script(string);
}

// Runs the string in javascript with eval(), returns nothing
void jsRun_string(WrenVM* vm) {
    const char* string = wrenGetSlotString(vm, 1);
    wrenSetSlotString(vm, 0, emscripten_run_script_string(string));
}

void jsRun_num(WrenVM* vm) {
    const char* string = wrenGetSlotString(vm, 1);
    double d;
    sscanf(emscripten_run_script_string(string), "%lf", &d);
    wrenSetSlotDouble(vm, 0, d);
}

void jsRun_bool(WrenVM* vm) {
    const char* string = wrenGetSlotString(vm, 1);
    const char* test = emscripten_run_script_string(string);
    if (strcmp(test, "true") == 0) {
        wrenSetSlotBool(vm, 0, true);
    } else {
        wrenSetSlotBool(vm, 0, false);
    }
}

WrenForeignMethodFn shimForeignMethodFn(
    WrenVM* vm,
    const char* module,
    const char* className,
    bool isStatic,
    const char* signature)
{
    if (strcmp(className, "JS") == 0 && strcmp(signature, "run_(_)") == 0) return jsRun;
    if (strcmp(className, "JS") == 0 && strcmp(signature, "string_(_)") == 0) return jsRun_string;
    if (strcmp(className, "JS") == 0 && strcmp(signature, "num_(_)") == 0) return jsRun_num;
    if (strcmp(className, "JS") == 0 && strcmp(signature, "bool_(_)") == 0) return jsRun_bool;
    return NULL;
}
*/