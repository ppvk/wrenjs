const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/wren.js',
    performance: {
        hints: false
    },
    output: {
        path: path.resolve(__dirname, '../out'),
        filename: 'wren.min.js',
        library: 'Wren'
    },
    watch: false
};
