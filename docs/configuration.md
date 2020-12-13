# Configuring the Wren VM

You can configure a new `Wren.VM` by passing it an object with the following properties:
* `resolveModuleFn`
* `loadModuleFn`
* `bindForeignMethodFn`
* `bindForeignClassFn`
* `writeFn`
* `errorFn`


Here is an example of a vm with all of these properites set:

    let vm = new Wren.VM({
        // The callback wrenjs uses to resolve a module name.
        resolveModuleFn:        myResolveModuleFn,

        // The callback wrenjs uses to load a module.
        loadModuleFn:           myLoadModuleFn,

        // The callback wrenjs uses to find a foreign method and bind it to a class.
        bindForeignMethodFn:    myBindForeignMethodFn,

        // The callback wrenjs uses to find a foreign class and get its foreign methods.
        bindForeignClassFn:     myBindForeignClassFn,

        // The callback wrenjs uses to print text.
        writeFn:                myWriteFn,

        // The callback wrenjs uses to print errors.
        errorFn:                myErrorFn,
    });

## resolveModuleFn

Some host applications may wish to support "relative" imports, where the
meaning of an import string depends on the module that contains it. To
support that without baking any policy into Wren itself, the VM gives the
host a chance to resolve an import string.

Before an import is loaded, it calls this, passing in the name of the
module that contains the import and the import string. The host app can
look at both of those and produce a new "canonical" string that uniquely
identifies the module. This string is then used as the name of the module
going forward. It is what is passed to [loadModuleFn], how duplicate
imports of the same module are detected, and how the module is reported in
stack traces.

If you leave this function undefined, then the original import string is
treated as the resolved string.

If an import cannot be resolved by the embedder, it should return null and
Wren will report that as a runtime error.

    function resolveModuleFn(importer, name) {
        // resolve the module
        return resolvedName;
    }

## loadModuleFn

Since Wren does not talk directly to the file system, it relies on the
embedder to physically locate and read the source code for a module. The
first time an import appears, Wren will call this and pass in the name of
the module being imported. The VM should return the soure code for that
module.

This will only be called once for any given module name. Wren caches the
result internally so subsequent imports of the same module will use the
previous source and not call this.

If a module with the given name could not be found by the embedder, it
should return null and Wren will report that as a runtime error.

    function loadModuleFn(name) {
        // get the source code of the wren module with name
        return module;
    }

## bindForeignMethodFn

When a foreign method is declared in a class, this will be called with the
foreign method's module, class, and signature when the class body is
executed. It should return a pointer to the foreign function that will be
bound to that method.

If the foreign function could not be found, this should return null and
Wren will report it as runtime error.

    function bindForeignMethodFn(vm, module, className, isStatic, signature) {
        // determine correct function to return
        return methodFunction;
    }

## bindForeignClassFn

When a foreign class is declared, this will be called with the class's
module and name when the class body is executed. It should return an object
containing foreign functions used to allocate and finalize the foreign object
when an instance is created.

    function defaultBindForeignClassFn(vm, module, className) {

        // get the allocate and finalize functions for this class

        let methods = {
            allocate: allocateFn,
            finalize: finalizeFn
        }
        return methods
    }

## writeFn

The callback wrenjs uses to display text when `System.print()` or the other
related functions are called.

If left undefined, the text is printed to the console.

    function defaultWriteFn(toLog) {
        // print toLog somewhere
    }

## errorFn

When an error occurs, this will be called with the module name, line
number, and an error message.

If left undefined, the error is printed to the console.

    function defaultErrorFn(errorType, module, line, msg) {
        // print the error's details somewhere
    }
