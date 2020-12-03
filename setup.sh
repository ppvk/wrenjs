#!/bin/bash

# Get portable emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
git pull

# Update emscripten
./emsdk update
./emsdk install latest
./emsdk activate latest
