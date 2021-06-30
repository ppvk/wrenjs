import * as Wren from "../out/wren.js";

for await (const dirEntry of Deno.readDir("./wren/test/benchmark")) {
  if (dirEntry.name.includes(".wren")) {
    let source = await Deno.readTextFile("./wren/test/benchmark/" + dirEntry.name);

    let vm = new Wren.VM();

    console.log([dirEntry.name]);
    vm.interpret(dirEntry.name, source);
  }
}
