# wrenjs
This is my attempt at using [emscripten](http://kripken.github.io/emscripten-site/)
to transpile Bob Nystrom's [wren](http://munificent.github.io/wren/) language to Javascript.

## Build Instructions 

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

#API
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