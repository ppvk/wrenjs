class JS {
    foreign static run_(string)
    foreign static string_(string)
    foreign static num_(string)
    foreign static bool_(string)

    static log(js_object) {
        JS.run_("console.log(" + js_object.native + ")")
    }

    // Takes in simple wren objects and converts them into a Js friendly string.
    static wrenToJs_(object) {
      if (object is String) {
        return "\"" + object + "\""
      } else if (object is JsObject) {
        return object.native
      } else {
        return object.toString
      }
    }

    // If possible, converts JsObjects into one of wren's basic types.
    static jsToWren_(object) {
      if (JS.isNull(object) || JS.isUndefined(object)) {
        object.free()
        return Null
      } else if (JS.isString(object)) {
        var string = object.string
        object.free()
        return string
      } else if (JS.isNumber(object)) {
        var number = object.num
        object.free()
        return number
      } else if (JS.isBoolean(object)) {
        var bool = object.bool
        object.free()
        return bool
      } else {
        return object
      }
    }

    // Uses typeof to check if a JsObject is a string.
    static isString(object) {
      var js = "typeof(" +
      wrenToJs_(object) +
      ") === 'string' || " +
      wrenToJs_(object) +
      " instanceof String"
      return bool_(js)
    }

    // Uses typeof to check if a JsObject is a number.
    static isNumber(object) {
      return bool_("typeof(" + wrenToJs_(object) + ") === 'number'")
    }

    // Uses typeof to check if a JsObject is a boolean.
    static isBoolean(object) {
      return bool_("typeof(" + wrenToJs_(object) + ") === 'boolean'")
    }

    static isNull(object) {
      return bool_(wrenToJs_(object) + "=== null")
    }

    static isUndefined(object) {
      return bool_("typeof(" + wrenToJs_(object) + ") === 'undefined'")
    }
}

class JsObject {

  // JsObject.new("Object") is equivalent to "new Object()" in JavaScript.
  construct new(js) {
    _id = JS.num_("WrenVM._register( new " + js + "() )")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  construct new(js, args) {
    js = "new " + js + "("
    js = js + JS.wrenToJs_(args[0])
    if (args.count > 1) {
        for ( i in 1...(args.count) ) {
          js = js + "," + JS.wrenToJs_(args[i])
        }
    }
    js = js + ")"
    _id = JS.num_("WrenVM._register(" + js + ")")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  // wraps an already existing JavaScript object in a new JsObject.
  construct wrap(js) {
    _id = JS.num_("WrenVM._register(" + js + ")")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  // Allows the JavaScript garbage collector to collect this object.
  free() {
    JS.run_("WrenVM._free(" + _id.toString + ")")
  }

  native {
    return _reference
  }

  [property] {
    return JS.jsToWren_(JsObject.wrap(native + "." + property))
  }

  [property] = (value) {
    JS.run_(_reference + "." + property + " = " + JS.wrenToJs_(value))
  }

  call() {
    var js = _reference + "()"
    return JS.jsToWren_(JsObject.wrap(js))
  }

  call(args) {
    var js = _reference + "("
    js = js + JS.wrenToJs_(args[0])
    if (args.count > 1) {
        for ( i in 1...(args.count) ) {
          js = js + "," + JS.wrenToJs_(args[i])
        }
    }
    js = js + ")"
    return JS.jsToWren_(JsObject.wrap(js))
  }

  callMethod(method) {
    var js = _reference + "." + method + "()"
    return JS.jsToWren_(JsObject.wrap(js))
  }

  callMethod(method, args) {
    var js = _reference + "." + method + "("
    js = js + JS.wrenToJs_(args[0])
    if (args.count > 1) {
        for ( i in 1...(args.count) ) {
          js = js + "," + JS.wrenToJs_(args[i])
        }
    }
    js = js + ")"

    return JS.jsToWren_(JsObject.wrap(js))
  }

  string {
    return JS.string_(native)
  }

  num {
    return JS.num_(native)
  }

  bool {
    return JS.bool_(native)
  }

}
