let fs = require('fs');

let wren_h = fs.readFileSync('wren/src/include/wren.h', 'utf8');
let lines = wren_h.split('\n');

let functions = [];

for (let l = 0; l < lines.length; l++) {
    let line = lines[l];
    if (line.startsWith('WREN_API')) {
        line = line.split('(')[0];
        let splitOnSpace = line.split(' ');
        line = splitOnSpace[splitOnSpace.length - 1];
        functions.push(line);
    }
}

fs.writeFileSync('src/generated/exports', functions.join('\n'));

// Log the C API functions that don't have a JS API function associated with them.
let shim_c = fs.readFileSync('src/wren.js', 'utf8');
let firstWarning = true;
for (let f = 0; f < functions.length; f++) {
  let shimFunction = functions[f].replace('wren', '');
  if (!shim_c.toLowerCase().includes(shimFunction.toLowerCase())) {
    if (firstWarning == true) {
      firstWarning = false;

      console.warn(`
        The following C functions do not have JS functions in src/wren.js defined for them.
        This should only display if you are hacking on a new version.
      `);
    };

    console.warn('        ' + functions[f]);
  }
}
