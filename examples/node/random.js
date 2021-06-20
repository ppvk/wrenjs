global.Wren = require('../../out/wren.min.js');

Wren.ready.then((_)=> {
  console.log("Wren is ready...");

  let vm = new Wren.VM();
  //vm.interpret('main', 'System.print(123456)');
});
