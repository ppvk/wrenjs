# wrenjs
Using [emscripten](http://kripken.github.io/emscripten-site/)
to transpile Bob Nystrom's [wren](http://munificent.github.io/wren/) language to Javascript.

#JavaScript API

    // Creates the wren VM.
    newVM();
    
    // Interpret wren code on the VM
    // Takes two strings, 
    // the first represents where the script is being run from,
    // the second is the wren script itself.
    // Doesn't return anything.
    interpret("JS", 'IO.print("Wren-tastic!")')
    
    // frees up the VM's memory.
    freeVM();

#Wren API

On the wren side of things there is a 'JS' class that facilitates simple wren/js interop.
At the moment, it has four methods. 

### JS.run(string)
    //runs its string as JavaScript. It doesn't return anything, 
    //but is useful for firing off a function or two.
    JS.run(string)
    
### JS.getString(string)
    // calling 'JS.getString' works similarly to 'JS.run,' 
    //but returns the result as a String
    var wrenString = JS.getString(string)
    // for example, to access the browser's userAgent in wren:
    var userAgent = JS.getString("window.navigator.userAgent")
    
### JS.getInt(string)
    // 'JS.getInt' is the same as 'JS.getString,' but returns an int.
    Js.getInt(string)

### JS.event(String type, String data)
    // 'JS.event' spawns a browser event of 'type', with 'data' as its detail value.
    // You can use this to trigger events in your browser game from wren.
    JS.event(type, data)
    
## Module imports
    // when you 'import' a module, wren expects it to be a JavaScript string 
    // or a function that returns a string.
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