let Wren = require('../../out/wren.min.js');
global.Wren = Wren;

Wren.ready.then((_)=> {
  console.log("Wren is ready...");

  let vm = new Wren.VM();
  vm.interpret('main', 'import "random" for Random');
  vm.interpret('main', 'var rand = Random.new(123456)');
  vm.interpret('main', 'System.print(123)');
});
