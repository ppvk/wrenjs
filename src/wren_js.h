#ifndef wren_js_h
#define wren_js_h

#include "wren.h"
#include "wren_common.h"

void wrenLoadJSLibrary(WrenVM* vm);

WrenForeignMethodFn wrenBindJS(WrenVM* vm,
                               const char* module,
                               const char* className,
                               bool isStatic,
                               const char* signature);
#endif

