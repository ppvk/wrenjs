#include <string.h>
#include "wren.h"
#include "emscripten.h"

// Allows `System.print()` to log to the terminal.
static void shimWriteFn(WrenVM* vm, const char* toLog) {
    if (strcmp(toLog, "\n") == 0) {
        return;
    }
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "Wren.writeFn(%p, '%s')", vm, toLog);
    emscripten_run_script(buffer);
}

// Looks for Strings by key in the `WrenVM.module` object.
char* loadModule(WrenVM* vm, const char* module) {
    char buffer[1024];
    snprintf(buffer, sizeof buffer, "WrenVM.module.%s", module);
    return emscripten_run_script_string(buffer);
}

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

void jsRun_int(WrenVM* vm) {
    const char* string = wrenGetSlotString(vm, 1);
    wrenSetSlotDouble(vm, 0, emscripten_run_script_int(string));
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
    if (strcmp(className, "JS") == 0 && strcmp(signature, "num_(_)") == 0) return jsRun_int;
    if (strcmp(className, "JS") == 0 && strcmp(signature, "bool_(_)") == 0) return jsRun_bool;
    return NULL;
}

// Sets default settings for a new wren VM and returns a pointer for it.
WrenVM* shimNewVM() {
    WrenConfiguration config;
    wrenInitConfiguration(&config);
    config.writeFn = shimWriteFn;
    config.bindForeignMethodFn = shimForeignMethodFn;
    config.loadModuleFn = loadModule;
    return wrenNewVM(&config);
}
