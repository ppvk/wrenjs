import "please" for Please
import "js" for JS, JsObject

System.print("Wren.js, js.wren tests:")

System.print(" JS.string_() test")
Please.succeed {
    var testString = JS.string_("testString")
    Please.equal(testString, "test")
}
System.print(" JS.string_() passed")

System.print(" JS.num_()  test")
Please.succeed {
    var testNum = JS.num_("testNum")
    Please.equal(testNum, 5.5)
}
System.print(" JS.num_() passed")

System.print(" JS.bool_()  test")
Please.succeed {
    var testBool = JS.bool_("testBool")
    Please.equal(testBool, true)
}
System.print(" JS.bool_() passed")

