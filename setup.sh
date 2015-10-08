#!/bin/bash

# clone wren
git clone https://github.com/munificent/wren.git

# Create a place for our outgoing wren.js file
mkdir -p out

echo "This is when I'd normally install emscripten"

# Get portable emscripten
#wget https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz -P ./emscripten

# Untar the downloaded file
#tar xvzf emscripten/emsdk-portable.tar.gz -C ./emscripten

# Update emscripten
#./emscripten/emsdk_portable/emsdk update
#./emscripten/emsdk_portable/emsdk install latest
#./emscripten/emsdk_portable/emsdk activate latest
