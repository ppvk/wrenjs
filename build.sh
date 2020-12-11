#!/bin/bash
clear

if ! [[ -d "./emsdk" ]]; then
    # Get portable emscripten
    git clone https://github.com/emscripten-core/emsdk.git --branch 2.0.10
    ./emsdk/emsdk install latest
    ./emsdk/emsdk activate latest
fi

# Setup the PATH
source emsdk/emsdk_env.sh
clear

if ! [[ -d "./wren" ]]; then
    # clone wren
    git clone https://github.com/wren-lang/wren.git --branch 0.3.0

    # Use emscripten to generate a bytecode libwren.a, with extras
    cd wren/projects/make
    emmake make config=release_32bit wren
    cd ../../../
fi

# Create a place for our Emscripten generated module
mkdir -p src/generated

# Extract the function exports from wren.h
node scripts/exports.js

# Exported Functions pulled from the exports file.
# each function needs to be on its own line and have no spaces
fn="["
readarray -t LINES < "src/generated/exports"
for LINE in "${LINES[@]}"; do
  fn="$fn'_$LINE',"
done
# trim trailing comma
fn="${fn::-1}"
fn="$fn]"

# Compile libwren.a with the shim code to wren_h.js
emcc \
    wren/lib/libwren.a src/shim.c \
    -I wren/src/include \
    -o out/wren.js \
    -O0 \
    -s ASSERTIONS=1 \
    -s ENVIRONMENT='web' -s JS_MATH=1 \
    -s MODULARIZE=0 -s EXPORT_ES6=0 -s FILESYSTEM=0 \
    -s EXPORT_ALL=0 -s LINKABLE=0 \
    -s WASM=0 -s ALLOW_MEMORY_GROWTH=1 -s ALLOW_TABLE_GROWTH=1 \
    -s INCOMING_MODULE_JS_API=[] -s EXTRA_EXPORTED_RUNTIME_METHODS=["ccall","addFunction","UTF8ToString"] \
    -s EXPORTED_FUNCTIONS=$fn \
    --pre-js src/glue/pre.js \
    --post-js src/shim.js \
    --post-js src/glue/post.js \
    -Werror --memory-init-file 0 \

#npx webpack --config scripts/webpack.js;

# clean up
rm -r src/generated
