var fs = require('fs');

// import wrenjs
eval(fs.readFileSync('./out/wren.js').toString());

var tests = [
  'core'
];

tests.forEach(function (test) {
  fs.readdir('./wren/test/' + test, (err, dirs) => {
    dirs.forEach( function (dir) {
      if (dir.endsWith('.wren')) {
        console.log(test + '/' + dir);
        var deltaBlue = fs.readFileSync('./wren/test/' + test + '/' + dir).toString();
        var config = new WrenConfiguration();
        var vm = new WrenVM(config);
        vm.interpret(deltaBlue);
        console.log("END OF " + test + '/' + dir + "\n");
      } else if (dir.includes('foreign') || dir.includes('module')) {
        // do nothing
      } else {
        fs.readdir('./wren/test/'  + test + '/' + dir, (err, files) => {
          files.forEach(function (file) {
            console.log(test + '/' + dir + '/' + file);
            var deltaBlue = fs.readFileSync('./wren/test/' + test + '/' + dir + '/' + file).toString();
            var config = new WrenConfiguration();
            var vm = new WrenVM(config);
            vm.interpret(deltaBlue);
            console.log("END OF " + test + '/' + dir + '/' + file + "\n");
          });
        });
      }
    });
  });

});
