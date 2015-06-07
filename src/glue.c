#include "wren.h"
#include "emscripten.h"
#include "wren_js.h"

WrenVM* vm;

void newVM() {
    if (vm != NULL) {
        EM_ASM(throw('VM already created!'););
    }
        
    WrenConfiguration config;
    config.bindForeignMethodFn = wrenBindJS;
    config.initialHeapSize = 1024 * 1024 * 100;
    config.reallocateFn = NULL;
    config.minHeapSize = 0;
    config.heapGrowthPercent = 0;
    vm = wrenNewVM(&config);
    wrenLoadJSLibrary(vm);
}

void freeVM() {
    if (vm == NULL) {
        EM_ASM(throw('VM already destroyed!'););
    }
    wrenFreeVM(vm);
    vm = NULL;
}

void interpret(char* sourcePath, char* source) {
    if (vm == NULL) {
        EM_ASM(throw('VM does not exist!'););
    }
    wrenInterpret(vm, sourcePath, source);
}












