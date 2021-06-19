#include <string.h>
#include <stdio.h>
#include "emscripten.h"
#include "wren.h"

/*
    This C file contains the bindings that connect the world of wren to the
    world of JavaScript.

    We do this by making all the functions in the WrenConfiguration call out to
    the JavaScript context, and trigger a sister JavaScript function. These are
    stored in the configuration object attached to the JavaScript version of
    the VM.
    Often these functions will require arguments, and we pass those to
    JavaScript land via the `wrenSetSlot` and `wrenGetSlot` family of functions.

    For example, in the case of the `wrenWriteFn`,
        1. Someone calls `System.print("x")` in wren
        2. In the C context,
            the WrenVM, calls `shimWriteFn("x");`
        3. `shimWriteFn` then
            a. stores the VM's pointer in wrenSlot 0,
            b. and 'x' in wrenSlot 1,
            c. then uses EM_ASM to tell the JavaScript context it has done so.
        4. In the JavaScript context,
            a) the VM's pointer is pulled from wrenSlot 0 and used to find the
               JavaScript `Wren.VM` associated with it.
            b) 'x' is pulled from wrenSlot 1 and used as the argument for
                calling the JS version of the VM's `writeFn`.

    Through this style of implementation, the person trying to create and use
    JavaScript `Wren.VM`s can just assign a regular JS function to their VM's
    configuration object, and it just works.

    In the JS context, they lose the 'wren' prefix, and are methods on instances
    of the `Wren.VM` class. They also do not require the vm Pointer as an
    argument.

    At the moment, you can statically access these VM instances by pointer.
    for example,
        `let vm = Wren.VM[123456];`
    or within shim.js as,
        `let vm = VM[123456];`

    We use this pointer-indexing in the JavaScript we call from C

    There are solely emscripten-based ways of passing these arguments, but they
    all have unpleasant limitations.
    - emscripten_run_script
        - works using `eval` (we're stuck in the global context)
        + lets us pass Strings to JavaScript pretty easily
    - EM_ASM/EM_JS
        * is nicely scoped
        - strings are a bit tricky to pass around.

    I've opted to use wrenSlots as much as possible, and EM_ASM to trigger the
    relevant JavaScript functions.
*/

const char* shimResolveModuleFn(WrenVM* vm,
    const char* importer, const char* name) {
    wrenEnsureSlots(vm, 3);
    wrenSetSlotString(vm, 0, importer);
    wrenSetSlotString(vm, 1, name);

    EM_ASM({
        let importer = Wren.VM[$0].getSlotString(0);
        let name = Wren.VM[$0].getSlotString(1);

        let output = Wren.VM[$0].config.resolveModuleFn(importer, name);
        Wren.VM[$0].setSlotString(2, output);
    }, vm);

    const char* output = wrenGetSlotString(vm, 2);
    return (char*)output;
}

char* shimLoadModuleFn(WrenVM* vm, const char* name) {
    wrenEnsureSlots(vm, 2);
    wrenSetSlotString(vm, 0, name);

    EM_ASM({
        let name = Wren.VM[$0].getSlotString(0);
        let module = Wren.VM[$0].loadModule(name);

        if (module == null) {
            // Could not find module
            // This does throw a runtime error, as expected
            // however it seems to complain about missing implementations rather
            // than missing modules. TODO, need to look into this more.
            Wren.VM[$0].setSlotBool(2, false);
        } else {
            // Could find module
            Wren.VM[$0].setSlotBool(2, true);
            Wren.VM[$0].setSlotString(1, module);
        }

    }, vm);

    if (wrenGetSlotBool(vm, 2) == false) {
        return NULL;
    }

    const char* module = wrenGetSlotString(vm, 1);
    return (char*)module;
}


// This pointer and the function right below it are meant to be reusable.
// Everytime we set a ForeignMethodFn, we use this pointer as a way to send that
// Function pointer to C
WrenForeignMethodFn shimForeignMethod;

EMSCRIPTEN_KEEPALIVE
void setCurrentForeignMethod(WrenForeignMethodFn foreignMethod) {
    shimForeignMethod = foreignMethod;
}

// This is easily the most complicated part of these shim files.
// It warrants a detailed explanation.
WrenForeignMethodFn shimBindForeignMethodFn(WrenVM* vm,
    const char* module, const char* className, bool isStatic,
    const char* signature) {

    // Pepare to send the arguments to JavaScript
    wrenEnsureSlots(vm, 4);
    wrenSetSlotString(vm, 0, module);
    wrenSetSlotString(vm, 1, className);
    wrenSetSlotBool(vm, 2, isStatic);
    wrenSetSlotString(vm, 3, signature);

    EM_ASM({
        // Get those arguments
        let module = Wren.VM[$0].getSlotString(0);
        let className = Wren.VM[$0].getSlotString(1);
        let isStatic = Wren.VM[$0].getSlotBool(2);
        let signature = Wren.VM[$0].getSlotString(3);

        let foreignMethodFn = Wren.VM[$0].bindForeignMethod(
            module, className, isStatic, signature
        );

        // We use a Bool in slot 0 to let our C code know that we're missing the
        // JavaScript function to bind.
        if (foreignMethodFn == null) {
            // We did not find a method
            Wren.VM[$0].setSlotBool(0, false);
        } else {
            // We did find a method
            Wren.VM[$0].setSlotBool(0, true);

            let fnPointer = addFunction(foreignMethodFn, 'vi');
            // this sets our reusable pointer to the JavaScript function we just
            // wrapped.

            ccall('setCurrentForeignMethod',
              null,
              ['number'],
              [fnPointer]
            );
        }

    }, vm);

    if (wrenGetSlotBool(vm, 0) == false) {
        return NULL;
    }

    return shimForeignMethod;
}


WrenForeignMethodFn shimAllocate;
WrenFinalizerFn shimFinalize;

EMSCRIPTEN_KEEPALIVE
void setClassMethods(WrenForeignMethodFn allocate, WrenFinalizerFn finalize) {
    shimAllocate = allocate;
    shimFinalize = finalize;
}

WrenForeignClassMethods shimBindForeignClassFn(
    WrenVM* vm, const char* module, const char* className) {

    wrenEnsureSlots(vm, 2);
    wrenSetSlotString(vm, 0, module);
    wrenSetSlotString(vm, 1, className);

    EM_ASM({
        let module = Wren.VM[$0].getSlotString(0);
        let className = Wren.VM[$0].getSlotString(1);

        let classMethods = Wren.VM[$0].bindForeignClass(module, className);

        if (classMethods == null) {
            // We did not find this class
            Wren.VM[$0].setSlotBool(0, false);
        } else {
            // We did find this class
            Wren.VM[$0].setSlotBool(0, true);

            // Convert the JS functions to pointers
            let allocatePtr = addFunction(classMethods.allocate, 'vi');
            let finalizePtr = addFunction(classMethods.finalize, 'vi');

            // Send those pointers to C
            ccall('setClassMethods',
              null,
              ['number', 'number'],
              [allocatePtr, finalizePtr]
            );
        }

    }, vm);

    WrenForeignClassMethods methods;

    if (wrenGetSlotBool(vm, 0) == false) {
        return methods;
    }

    methods.allocate = shimAllocate;
    methods.finalize = shimFinalize;

    return methods;
}


void shimWriteFn(WrenVM* vm, const char* text) {
    if (strcmp(text, "\n") == 0) {
        return;
    }

    wrenEnsureSlots(vm, 1);
    wrenSetSlotString(vm, 0, text);

    EM_ASM({
        let text = Wren.VM[$0].getSlotString(0);
        Wren.VM[$0].write(text);
    }, vm);
}

void shimErrorFn(
    WrenVM* vm, WrenErrorType type, const char* module, int line,
    const char* message) {

    wrenEnsureSlots(vm, 4);
    wrenSetSlotDouble(vm, 0, type);
    wrenSetSlotString(vm, 1, module);
    wrenSetSlotDouble(vm, 2, line);
    wrenSetSlotString(vm, 3, message);

    EM_ASM({
        let type = Wren.VM[$0].getSlotDouble(0);
        let module = Wren.VM[$0].getSlotString(1);
        let line = Wren.VM[$0].getSlotDouble(2);
        let message = Wren.VM[$0].getSlotString(3);

        Wren.VM[$0].error(type, module, line, message);
    }, vm);
}

// Reusable WrenConfiguration
WrenConfiguration config;

EMSCRIPTEN_KEEPALIVE
WrenVM* shimNewVM() {
    EM_ASM({
        if (Wren == undefined) {
          throw('Global Wren object is missing!');
        }
    });

    wrenInitConfiguration(&config);
    config.writeFn = shimWriteFn;
    config.errorFn = shimErrorFn;
    config.bindForeignMethodFn = shimBindForeignMethodFn;
    config.bindForeignClassFn = shimBindForeignClassFn;
    config.loadModuleFn = shimLoadModuleFn;
    config.resolveModuleFn = shimResolveModuleFn;

    WrenVM* vm = wrenNewVM(&config);
    return vm;
}
