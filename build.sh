#!/bin/bash
clear

# The first thing we need, is the Emscripten SDK.
# We check to see if it is already here, and pull it if it's not.
if ! [[ -d "./emsdk" ]]; then
    # Get portable emscripten
    git clone https://github.com/emscripten-core/emsdk.git --branch 2.0.21
    ./emsdk/emsdk install latest
    ./emsdk/emsdk activate latest
fi

# We will need to add the sdk's tools to our path, so we do so here.
source emsdk/emsdk_env.sh
clear

# Then we check to see if we have a local copy of wren's source.
# If not, we pull that as well.
if ! [[ -d "./wren" ]]; then
    # clone wren
    git clone https://github.com/wren-lang/wren.git --branch 0.4.0

    # We generate an 'amalgamation' of the wren source.
    # since it's a bit easier to work with one single file.
    cd wren
    python3 util/generate_amalgamation.py > wren.c
    cd ../
fi

# Next we create a temporary directory in our src for generated files.
# Think of it as a workbench where we put our partially built parts for later
# assembly.
mkdir -p src/generated

# The exports.js script combs through the wren.h file and generates a list of
# functions to export. These are then fed to the compiler later. If this is not
# done, we will lose access to them. This list is placed in
# "src/generated/exports".
node scripts/exports.js

# Now that we have that list of functions to export, we need to format them in
# a way that the compiler can understand. That is what we are doing here.
fn="["
readarray -t LINES < "src/generated/exports"
for LINE in "${LINES[@]}"; do
  fn="$fn'_$LINE',"
done
# trim trailing comma
fn="${fn::-1}"
fn="$fn]"

# Here's the biggest part of the compilation process. We use emscripten to
# compile the wren library, and add some special shim code to ease communication
# between the C and JS worlds. Note the EXPORTED_FUNCTIONS setting, that is
# where we put those exports from above. This generates libwren.js in the
# "src/generated" directory.
emcc -DWREN_OPT_RANDOM -DWREN_OPT_META \
    wren/wren.c src/shim.c -I wren/src/include -o src/generated/libwren.js \
    -O3 -s WASM=1 \
    -s ASSERTIONS=0 -s ENVIRONMENT='web,node' \
    -s JS_MATH=1 -s WASM_ASYNC_COMPILATION=0 \
    -s MODULARIZE=1 -s EXPORT_ES6=1 \
    -s FILESYSTEM=0 -s SINGLE_FILE=1 \
    -s ALLOW_MEMORY_GROWTH=1 -s ALLOW_TABLE_GROWTH=1 \
    -s INCOMING_MODULE_JS_API=[] -s DYNAMIC_EXECUTION=0 \
    -s EXPORTED_RUNTIME_METHODS=["ccall","addFunction"] \
    -s EXPORTED_FUNCTIONS=$fn \
    -Werror --memory-init-file 0 \

# Next we need to combine that compiled C with our Javascript API to complete
# the library. This outputs wren.min.js in the out directory.
if ! [[ -d "./node_modules" ]]; then
    npm install
fi

# Bundle our ES6 modules up into a self contained bundle.
npx rollup ./src/wren.js --file ./src/generated/wren-bundle.js --format esm --name "Wren"

# Minify the generated bundle
npx uglifyjs ./src/generated/wren-bundle.js \
    -o ./out/wren.js -c -m

# Generate our documentation
rm -r docs
npx jsdoc --template ./node_modules/minami -d docs ./src/wren.js ./README.md

# clean up
rm -r src/generated

# run some of the tests in wren/test.
# some of these will fail, but major errors can indicate something is broken.
#echo "[Running tests in './wren/test/']"
#npm run test
