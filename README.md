# wrenjs
Using [emscripten](http://kripken.github.io/emscripten-site/)
to transpile Bob Nystrom's [wren](http://munificent.github.io/wren/) language to Javascript.

[JS module API Documentation](modules/js.md)

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
