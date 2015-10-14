#!/bin/bash

# Exported Functions - the '_' is required. NO spaces please.
FUNCTIONS="['_newVM','_freeVM','_interpret']"

# Copy our js-interop source files to wren's src directory
cp src/binding/*.c wren/src/vm
cp src/binding/*.h wren/src/vm

# Copy our wren-interop source files to wren's interop directory
cp src/modules/*.wren wren/builtin

# Setup the PATH
 source emscripten/emsdk_portable/emsdk_env.sh

# Move into the wren directory
cd wren

# inject js.wren
make builtin

echo "This is when I'd normally build"

# Use emscripten to generate a bytecode libwren.a, with extras
$EMSCRIPTEN/emmake make

# Compile the custom libwren.a with the js interface
$EMSCRIPTEN/emcc -O3 ../wren/lib/libwren.a -o ../out/wren.js -s EXPORTED_FUNCTIONS=$FUNCTIONS -s ASSERTIONS=1 -Werror --memory-init-file 0 --pre-js ../src/binding/glue-pre.js --post-js ../src/binding/glue-post.js
