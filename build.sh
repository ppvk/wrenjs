#!/bin/bash

# Setup the PATH
source emsdk/emsdk_portable/emsdk_env.sh

# clone wren
git clone https://github.com/munificent/wren.git

# Create a place for our outgoing wren.js file
mkdir -p out

# Copy our js-interop source files to wren's src directory
cp src/*.c wren/src/vm
cp src/*.h wren/src/vm

# Move into the wren directory
cd wren

# clean up previous wren builds
make clean

# Use emscripten to generate a bytecode libwren.a, with extras
emmake make static

# Exported Functions - the '_' is required. NO spaces please.
fn="['_shimNewVM','_wrenFreeVM','_wrenInterpret']"

# Compile the custom libwren.a with the js interface
$EMSCRIPTEN/emcc -O3 ../wren/lib/libwren.a -o ../out/wren.js -s NO_FILESYSTEM=1 -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS=$fn -Werror --memory-init-file 0 --pre-js ../src/js-glue/glue-pre.js --post-js ../src/shim.js --post-js ../src/js-glue/glue-post.js
