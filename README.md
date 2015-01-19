# wrenjs
This is my attempt to use [emscripten](http://kripken.github.io/emscripten-site/)
to port Bob Nystrom's [wren](http://munificent.github.io/wren/) language to Javacript.

### If all you care about is the wren.js file, it's in the /out directory.

If you want to make a fresh version, that is a bit more complicated. Basically
emscripten needs to be installed and emcc needs to be on your PATH.

Then run:

    ./build.sh
For more information look in 'build.sh'.


#API
At the moment there is one function provided by this library.

    interpret(String source);
Basically it runs the source String as a wren script. For now, output goes directly to the Console.
