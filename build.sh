#!/bin/bash

# Exported Functions - the '_' is required.
FUNCTIONS="['_interpret']"

# Move into the wren directory to update the git Submodule
cd wren

# update wren
git pull

# Come home
cd ../

# Create a place for our outgoing wren.js file
mkdir -p out

# Copy our js-interop source files to wren's src directory
cp src/*.c wren/src

# Move into the wren directory
cd wren

# Use emscripten to generate a bytecode libwren.a, with extras
emmake make

# Come home again.
cd ../

# Compile the custom libwren.a with the js interface
emcc -O3 wren/libwren.a -o out/wren.html -s EXPORTED_FUNCTIONS=$FUNCTIONS --memory-init-file 0 --post-js src/*.js
