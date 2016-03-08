# 'JS' Module Documentation

---

## JsObject
JsObjects wrap actual JavaScript objects, allowing you to call them and their methods.

#### JsObject.new( String js, List args)
Evaluates the string as JavaScript, returning a wren JsObject that references the result.

#### JsObject.wrap( String js )
Evaluates the string as JavaScript, returning a wren JsObject that references the result.

#### JsObject.free()
Every JavaScript object wrapped by a JsObject is stored in a table to prevent it from being collected during GC. In order to prevent memory leaks, always call `free()` on your JsObjects when finished using them.

#### JsObject.call( List args )

Calls the JsObject like a function with `args`. Returns a JsObject if `returnsObject` is true. `returnsObject` is optional if `false`.

#### JsObject.callMethod( String method, List args )
Calls `method` on the JsObject with `args`. Returns a JsObject if `returnsObject` is true. `returnsObject` is optional if `false`.

#### JsObject[property]
Returns a `JsObject` representing the property.

#### JsObject[property] = value
Sets the `property` in the JavaScript context to whatever `value` returns.

#### JsObject.native
`native` is a getter for a string that always references the underlying JavaScript object.
Can be used as an argument for the `call` and `callMethod` methods.

    var document = new JsObject("document").native
    var console = new JsObject("console")
    console.callMethod("log", [document]) => Prints the `Document`

#### JsObject.string
If the JsObject is a JavaScript string, the `string` getter returns it as a wren string.

#### JsObject.num
If the JsObject is a JavaScript int, the `num` getter returns it as a wren num.

#### JsObject.bool
If the JsObject is a JavaScript bool, the `bool` getter returns it as a wren bool.

---

## JS
JS is a class containing static methods for working with JavaScript.

#### JS.log( JsObject jsObject )
Runs `console.log` on the `JsObject`, providing more information than `System.print`.

## Low-level JS methods


#### JS.run_( String js )
Runs the provided string as JavaScript.

#### JS.string_( String js )
Runs the provided string, returning its result as a string.

#### JS.int_( String js )
Runs the provided string, returning its result as an int.

#### JS.bool_( String js )
Runs the provided string, returning its result as a bool.
