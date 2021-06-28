#include <string.h>
#include <stdio.h>
#include "emscripten.h"
#include "wren.h"

/*
    This C file contains the bindings that connect the world of wren to the
    world of JavaScript.
*/

void modulePushString(const char* string) {
  EM_ASM({
      Module._values.push(
        UTF8ToString($0)
      );
  }, string);
}

void modulePushDouble(double number) {
  EM_ASM({
      Module._values.push($0);
  }, number);
}


const char* moduleShiftString() {
  int length = EM_ASM_INT({
    let index = Module._values.length - 1;
    return lengthBytesUTF8("" + Module._values[index]) + 1;
  });

  const char* string = malloc(length);

  EM_ASM({
      let s = "" + Module._values.shift();
      stringToUTF8( s, $0, lengthBytesUTF8(s) + 1);
  }, string);

  return string;
}

double moduleShiftDouble() {
  return EM_ASM_DOUBLE({
    let value = Module._values.shift();
    return value;
  });
}

/*
    The following are wrappers for functions normally attached to a WrenConfiguration.
*/

const char* shimResolveModuleFn(WrenVM* vm,
    const char* importer, const char* name) {
    modulePushString(importer);
    modulePushString(name);

    EM_ASM({
        let importer = Module._values.shift();
        let name = Module._values.shift();

        let output = Module._VMs[$0]._resolveModuleFn(importer, name);
        Module._values.push(output);
    }, vm);

    const char* output = moduleShiftString();

    if (strcmp(output, "null") == 1) {
        return NULL;
    } else {
        return output;
    }
}

void loadModuleComplete(WrenVM* vm, const char* module, WrenLoadModuleResult result) {
  if(result.source) {
    free((void*) result.source);
  }
}

WrenLoadModuleResult shimLoadModuleFn(WrenVM* vm, const char* name) {
    WrenLoadModuleResult result;
    memset(&result, 0, sizeof(WrenLoadModuleResult));

    modulePushString(name);

    EM_ASM({
        let name = Module._values.shift();
        let module = Module._VMs[$0]._loadModuleFn(name);

        if (module == null) {
            // Could not find module
            Module._values.push(0);
        } else {
            // Could find module
            Module._values.push(1);
            Module._values.push(module);
        }

    }, vm);

    bool found = moduleShiftDouble();
    if (found == 1) {
      result.source = moduleShiftString();
      result.onComplete = loadModuleComplete;
    } else {
      result.source = NULL;
      result.onComplete = NULL;
    }

    return result;
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
    modulePushString(module);
    modulePushString(className);
    if (isStatic) {
      modulePushDouble(1); // true
    } else {
      modulePushDouble(0); // false
    }
    modulePushString(signature);


    EM_ASM({
        // Get those arguments
        let module = Module._values.shift();
        let className = Module._values.shift();
        let isStatic = Module._values.shift() == 1;
        let signature = Module._values.shift();

        let foreignMethodFn = Module._VMs[$0]._bindForeignMethod(
            module, className, isStatic, signature
        );

        // We use a Bool in slot 0 to let our C code know that we're missing the
        // JavaScript function to bind.
        if (foreignMethodFn == null) {
            // We did not find a method
            Module._values.push(0);
        } else {
            // We did find a method
            Module._values.push(1);

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

    if (moduleShiftDouble() == 0) {
        return NULL;
    } else {
      return shimForeignMethod;
    }
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

    modulePushString(module);
    modulePushString(className);

    EM_ASM({
        let module = Module._values.shift();
        let className = Module._values.shift();

        let classMethods = Module._VMs[$0]._bindForeignClass(module, className);

        if (classMethods == null) {
            // We did not find this class
            Module._values.push(0);
        } else {
            // We did find this class
            Module._values.push(1);

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

    if (moduleShiftDouble() == 0) {
        return methods;
    } else {
      methods.allocate = shimAllocate;
      methods.finalize = shimFinalize;
      return methods;
    }

}


void shimWriteFn(WrenVM* vm, const char* text) {
    if (strcmp(text, "\n") == 0) {
        return;
    }

    modulePushString(text);

    EM_ASM({
        let text = Module._values.shift();
        Module._VMs[$0]._write(text);
    }, vm);
}

void shimErrorFn(
    WrenVM* vm, WrenErrorType type, const char* module, int line,
    const char* message) {

    modulePushDouble(type);
    modulePushString(module);
    modulePushDouble(line);
    modulePushString(message);

    EM_ASM({
        let type = Module._values.shift();
        let module = Module._values.shift();
        let line = Module._values.shift();
        let message = Module._values.shift();

        Module._VMs[$0]._error(type, module, line, message);
    }, vm);
}

// Reusable WrenConfiguration
WrenConfiguration config;

EMSCRIPTEN_KEEPALIVE
WrenVM* shimNewVM() {

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
