# wrenjs
This is my attempt at using [emscripten](http://kripken.github.io/emscripten-site/)
to transpile Bob Nystrom's [wren](http://munificent.github.io/wren/) language to Javascript.

## Build Instructions
I develop on an Ubuntu box, so these directions are meant for that sort of system.

You will need:
- build-essential
- cmake
- python2.7
- nodejs
- java

After these are installed, run

    ./setup.sh

That command will download the master branch of wren, get the latest portable emscripten setup and install it in the 'emscripten' directory. As your system will have to build emscripten from scratch, this process takes quite a while.


Once finished, run:

    ./build.sh
This puts the emscripten tools on your PATH temporarily, moves the wrenjs specific c files into wren's src folder, and compiles the wren VM to Javascript.


#API
At the moment there is one function provided by this library.

    interpret(String source);
Basically it runs the source String as a wren script. For now, output goes directly to the Console.
