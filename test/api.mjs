import Wren from "../out/wren.js";



/*
* A very simple testing framework.
* `test` is the name of the test.
* `toTest` is a statement that resolves to a bool.
*/

let test;
let errorFnResult;
let writeFnResult;
let vm;
function assert(name, toTest) {
  if (toTest == false) {
    console.error('[FAILED]  ' + name);
  } else {
    console.log('[SUCCESS] ' + name);
  }
}

// Test wrenWriteFn
test = 'Configuration.writeFn';
vm = new Wren.VM({
  writeFn: function(message) {
    writeFnResult = message;
  }
});
vm.interpret(test, `
  System.print("success")
`);
assert(test,
  writeFnResult == 'success'
);
vm.free();

// Test wrenErrorFn
test = 'Configuration.errorFn';
vm = new Wren.VM({
  errorFn: function(errorType, module, line, msg) {
    errorFnResult = [errorType, module, line, msg];
  }
});
vm.interpret(test, `
  syntax error
`);
assert(test,
  errorFnResult[0] == Wren.ErrorType.COMPILE && errorFnResult[1] == test
)
vm.free();

// Test wrenLoadModuleFn
test = 'Configuration.loadModuleFn \n --- Configuration.resolveModuleFn';
let module = `
  System.print("module loaded")
`;
vm = new Wren.VM({
  loadModuleFn: function(name) {
    if (name == 'module') return module;
    else return null;
  },
  writeFn: function(message) {
    writeFnResult = message;
  },
  errorFn: function(errorType, module, line, msg) {
    errorFnResult = [errorType, module, line, msg];
  }
});
vm.interpret(test, `
  // should be successful.
  import "module"

  // should fail.
  import "no_module"
`);
assert(test,
  writeFnResult == 'module loaded'
)
assert(test,
  errorFnResult[1] == test
)
vm.free();

// Test bindForeignMethodFn
test = 'Configuration.bindForeignMethodFn';
let testValue = false;
function foreignMethod(vm) {
  testValue = vm.getSlotBool(1);
}
vm = new Wren.VM({
  writeFn: function(message) {
    console.log(message);
    writeFnResult = message;
  },
  errorFn: function(errorType, module, line, msg) {
    console.log([errorType, module, line, msg]);
    errorFnResult = [errorType, module, line, msg];
  },
  bindForeignMethodFn: function(module, className, isStatic, signature) {
    return foreignMethod;
  }
});
vm.interpret(test, `
  class Test {
    foreign static setTestValue(bool)
  }
  Test.setTestValue(true)
`);
assert(test,
  testValue == true
)
vm.free();


// Test bindForeignMethodFn
test = 'Configuration.bindForeignClassFn';

class Circle {
  constructor(radius) {
    this.radius = radius;
  }

  getRaidus(vm) {
    vm.ensureSlots(1);
    let value = this.radius;
    vm.setSlotDouble(0, value);
  }

  getDiameter(vm) {
    vm.ensureSlots(1);
    let value = this.radius * 2;
    vm.setSlotDouble(0, value);
  }
}

vm = new Wren.VM({
  writeFn: function(message) {
    writeFnResult = message;
  },
  errorFn: function(errorType, module, line, msg) {
    errorFnResult = [errorType, module, line, msg];
  },
  bindForeignClassFn: function(module, className) {
      function allocate(vm) {
          let radius = vm.getSlotDouble(1);
          let jsCircle = new Circle(radius);
          vm.ensureSlots(1);
          vm.setSlotNewForeign(0, 0, jsCircle);
      }
      function finalize(vm) {}
      return {
          allocate: allocate,
          finalize: finalize
      }
  },
  bindForeignMethodFn: function(module, className, isStatic, signature) {
      let method = signature.split('(')[0];

      return function(vm) {
          let jsObject = vm.getSlotForeign(0);
          jsObject[method](vm);
      };
  }
});
vm.interpret(test, `
  foreign class Circle {
      construct new(radius) {}

      foreign getRaidus()

      foreign getDiameter()
  }

  var circle = Circle.new(5)

  System.print( circle.getDiameter() )
`);
assert(test,
  writeFnResult == '10'
)
vm.free();
