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
test = 'Configuration.loadModuleFn';
let module = `
  System.print("module")
`;
vm = new Wren.VM({
  loadModuleFn: function(name) {
    if (name == 'module') return module;
    else return null;
  },
  writeFn: function(message) {
    writeFnResult = message;
    console.log(writeFnResult);
  },
  errorFn: function(errorType, module, line, msg) {
    errorFnResult = [errorType, module, line, msg];
    console.log(errorFnResult);
  }
});
vm.interpret(test, `
  import "random" for Random
  var r = Random.new()
  System.print(r.float(5))

  // should be successful.
  import "module"

  // should fail.
  import "no_module"
`);
assert(test,
  writeFnResult == 'module'
)
assert(test,
  errorFnResult[1] == test
)
vm.free();
