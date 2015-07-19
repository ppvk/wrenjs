#include "wren_js.h"
#include "emscripten.h"
#include <stdio.h>
#include <string.h>

// This string literal is generated automatically from js.wren. Do not edit.
static const char* jsLibSource =
"";

// Runs the string in javascript with eval(), returns nothing
static void jsRun(WrenVM * vm) {
    const char* s = wrenGetArgumentString(vm, 1);
    emscripten_run_script(s);
}

// Runs the function in javascript and passes a returned string to wren.
static void jsRun_getString(WrenVM * vm) {
    const char* s = wrenGetArgumentString(vm, 1);
    const char* r = emscripten_run_script_string(s);
    wrenReturnString(vm, r, -1);
}

// Runs the function in javascript and passes a returned int to wren.
static void jsRun_getInt(WrenVM * vm) {
    const char* s = wrenGetArgumentString(vm, 1);
    double r = emscripten_run_script_int(s);
    wrenReturnDouble(vm, r);
}

WrenForeignMethodFn wrenBindJS(WrenVM* vm,
                               const char* module,
                               const char* className,
                               bool isStatic,
                               const char* signature) {
  if (strcmp(signature, "run(_)") == 0) return jsRun;
  if (strcmp(signature, "getString(_)") == 0) return jsRun_getString;
  if (strcmp(signature, "getInt(_)") == 0) return jsRun_getInt;

  return NULL;
}

// Loads the JS wren library
void wrenLoadJSLibrary(WrenVM* vm)
{
  wrenInterpret(vm, "", jsLibSource);
}
