#include "wren.h"

void interpret(char* source) {
    WrenConfiguration config;

    // Since we're running in a standalone process, be generous with memory.
    config.initialHeapSize = 1024 * 1024 * 100;

    // Use defaults for these.
    config.reallocateFn = NULL;
    config.minHeapSize = 0;
    config.heapGrowthPercent = 0;

    WrenVM* vm = wrenNewVM(&config);

    wrenInterpret(vm, "JS", source);
}
