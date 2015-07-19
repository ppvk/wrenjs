# wrenjs
Using [emscripten](http://kripken.github.io/emscripten-site/)
to transpile Bob Nystrom's [wren](http://munificent.github.io/wren/) language to Javascript.

#JavaScript API

    // Creates the wren VM.
    // Can only have one at a time
    Wren.newVM();

    // Interpret wren code on the VM
    // Takes two strings,
    // the first represents where the script is being run from,
    // the second is the wren script itself.
    // Doesn't return anything.
    Wren.interpret("JS", 'IO.print("Wren-tastic!")')

    // frees up the VM's memory.
    Wren.freeVM();

#Wren API

On the wren side of things there is a 'JS' class that facilitates simple wren/js interop.
At the moment, it has four methods.

##JS
#### JS.run(string)
    //runs its string as JavaScript. It doesn't return anything,
    //but is useful for firing off a function or two.
    JS.run(string)

#### JS.getString(string)
    // calling 'JS.getString' works similarly to 'JS.run,'
    //but returns the result as a String
    var wrenString = JS.getString(string)
    // for example, to access the browser's userAgent in wren:
    var userAgent = JS.getString("window.navigator.userAgent")

#### JS.getInt(string)
    // 'JS.getInt' is the same as 'JS.getString,' but returns an int.
    Js.getInt(string)

#### JS.getObject(string)
    // returns a `JsObject` bound to whatever the string equals in JavaScript.
    // Equivalent to calling `new JsObject(object)`
    var console = JS.getObject("console")

## JsObject
`JsObjects` wrap actual JavaScript objects, allowing you to call them and their methods.

#### new JsObject(string)
    // constructs a JsObject bound to whatever the string equals in JavaScript
    // Examples:
    var console = new JsObject("console")                 // existing
    var newImage = new JsObject("new ImageElement()")     // constructed
    var pooledSloth = new JsObject("getSlothFromPool()") // functions

#### JsObject.free()
    // JavaScript objects are stored a table when bound to a JsObject
    // this prevents them from being garbage collected.
    // When you are sure that you will no longer be using a JsObject,
    // be sure to release it from the table.
    oldSprite.free();

#### JsObject.call(), JsObject([args])
    // lets you `call` the object like a function.
    jsFunction.call()
    print.call(["'Hi Mom!'"])

#### JsObject.callMethod(string), JsObject.callMethod(string, [args])
    // Similar to the `call` method, allows you to call methods on the JsObject
    // with any number of args.
    console.callMethod("log", [4, 5])
    monkey.callMethod("dance")

#### JsObject.native
    // Essentially a JavaScript query for the `JsObject`.
    // Can be used as an argument for the `call` and `callMethod` methods
    var document = new JsObject("document")
    var console = new JsObject("console")
    console.callMethod("log", [document.native]) => Prints the `Document`


## Module imports
when you 'import' a module, wren expects it to be a JavaScript string
or a function that returns a string.

    import "string"

# Build Instructions

These instructions are for an Ubuntu-like system.

You will need:
- build-essential
- cmake
- python2.7
- nodejs/iojs
- java

After these are installed, run

    ./setup.sh

That command will download the master branch of wren,
get the latest portable emscripten setup and install it in the 'emscripten' directory.
As your system will have to build emscripten from scratch,
this process takes quite a while.

Once finished, run:

    ./build.sh

This puts the emscripten tools on your PATH temporarily,
moves the wrenjs specific c files into wren's src folder,
and compiles the wren VM to Javascript.
