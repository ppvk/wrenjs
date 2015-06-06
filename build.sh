#!/bin/bash

# Exported Functions - the '_' is required. NO spaces please.
FUNCTIONS="['_newVM','_freeVM','_interpret']"

# Copy our js-interop source files to wren's src directory
cp src/*.c wren/src/vm

# Setup the PATH
source emscripten/emsdk_portable/emsdk_env.sh

# Move into the wren directory
cd wren

# Use emscripten to generate a bytecode libwren.a, with extras
$EMSCRIPTEN/emmake make

# Compile the custom libwren.a with the js interface
$EMSCRIPTEN/emcc -O3 ../wren/lib/libwren.a -o ../out/wren.html -s EXPORTED_FUNCTIONS=$FUNCTIONS -s ASSERTIONS=1 -Werror --memory-init-file 0 --post-js ../src/*.js
