import "please" for Please
import "js" for JS, JsObject

System.print("js.wren tests:")

System.write(" JsObject String test ...")
Please.succeed {
  var testString = JsObject.wrap("testString")
  Please.equal(testString.string, "test")
}
System.print("... passed")

System.write(" JsObject Number test ...")
Please.succeed {
  var testNum = JsObject.wrap("testNum")
  Please.equal(testNum.num, 5.5)
}
System.print(" ... passed")

System.write(" JsObject Boolean test ...")
Please.succeed {
  var testBool = JsObject.wrap("testBool")
  Please.equal(testBool.bool, true)
}
System.print(" ... passed")