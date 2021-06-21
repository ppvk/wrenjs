let Wren = require('../../out/wren.min.js');
global.Wren = Wren;

let modules = {};

modules['fish'] = `
  System.print("Teach a man to fish..")
`;

Wren.ready.then((_)=> {
  console.log("Wren is ready...");
  let vm = new Wren.VM({
    loadModuleFn: function(name) {
      return modules[name];
    }
  });

  vm.interpret('main', `
    System.print("Hello from Wren.")

    //import "fish"

    // Future Paul, for some reason wren doesn't know what to do when we send NULL as a module
    import "random" for Random
    var random = Random.new(123456)
    System.print(random.float(5))
  `);
});
