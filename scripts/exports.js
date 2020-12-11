let fs = require('fs');

let wren_h = fs.readFileSync('wren/src/include/wren.h', 'utf8');
let lines = wren_h.split('\n');

let functions = [];

for (let l = 0; l < lines.length; l++) {
    let line = lines[l];
    if (!line.startsWith('//') && line.includes(' wren') && line.includes('(')) {
        line = line.split('(')[0];
        let splitOnSpace = line.split(' ');
        line = splitOnSpace[splitOnSpace.length - 1];
        functions.push(line);
    }
}

fs.writeFileSync('src/generated/exports', functions.join('\n'));
