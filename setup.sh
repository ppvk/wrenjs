#!/bin/bash

# Get portable emscripten
wget https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz -P ./emsdk

# Untar the downloaded file
tar xvzf emsdk/emsdk-portable.tar.gz -C ./emsdk

# Update emscripten
./emsdk/emsdk_portable/emsdk update
./emsdk/emsdk_portable/emsdk install latest
./emsdk/emsdk_portable/emsdk activate latest
