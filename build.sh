#!/bin/bash

# Setup the PATH
source emsdk/emsdk_env.sh

# clone wren
git clone https://github.com/wren-lang/wren.git

# Create a place for our outgoing wren.js file
mkdir -p out

# Move into the wren directory
cd wren/projects/make

# clean up previous wren builds
make clean

# Use emscripten to generate a bytecode libwren.a, with extras
emmake make config=release_32bit wren

# Move out of the wren directory
cd ../../../
ls

# Exported Functions pulled from the exports file.
# each function needs to be on its own line and have no spaces
fn="["
readarray -t LINES < "src/exports"
for LINE in "${LINES[@]}"; do
  fn="$fn'_$LINE',"
done
# trim trailing comma
fn="${fn::-1}"
fn="$fn]"

# Compile libwren.a with the shim code
emcc -O3 wren/lib/libwren.a src/shim.c -I wren/src/include -o out/wren.js -s ALLOW_MEMORY_GROWTH=1 -s RESERVED_FUNCTION_POINTERS=1 -s NO_FILESYSTEM=1 -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS=$fn -Werror --memory-init-file 0 --pre-js src/js-glue/glue-pre.js --post-js src/shim.js --post-js src/js-glue/glue-post.js -s WASM=0
