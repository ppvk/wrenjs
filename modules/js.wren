class JS {
    foreign static run_(string)
    foreign static string_(string)
    foreign static num_(string)
    foreign static bool_(string)

    static log(jsObject) {
        JS.run_("console.log(" + jsObject.native + ")")
    }

    static makeSafe_(object) {
      if (object is String) {
        return "\"" + object + "\""
      } else if (object is JsObject) {
        return object.native
      } else {
        return object.toString
      }
    }

    static isNull(object) {
      return bool_(makeSafe_(object) + "=== null")
    }
    static isUndefined(object) {
      return bool_("typeof(" + makeSafe_(object) ") === 'undefined'")
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
    js = js + JS.makeSafe_(args[0])
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + JS.makeSafe_(args[i])
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

    // We don't want to save references to null or undefined.
    if (JS.isNull(this) || JS.isUndefined(this)) {
      this.free();
    }
  }

  // Allows the JavaScript garbage collector to collect this object.
  free() {
    JS.run_("WrenVM._free(" + _id.toString + ")")
  }

  native {
    return _reference
  }

  [property] {
    return JsObject.wrap(native + "." + property)
  }

  [property] = (value) {
    JS.run_(_reference + "." + property + " = " + JS.makeSafe_(value))
  }

  call() {
    var js = _reference + "()"
    return JsObject.wrap(js)
  }

  call(args) {
    var js = _reference + "("
    js = js + JS.makeSafe_(args[0])
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + JS.makeSafe_(args[i])
        }
    }
    js = js + ")"
    System.print(js)
    return JsObject.wrap(js)
  }

  callMethod(method) {
    var js = _reference + "." + method + "()"
    return JsObject.wrap(js)
  }

  callMethod(method, args) {
    var js = _reference + "." + method + "("
    js = js + JS.makeSafe_(args[0])
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + JS.makeSafe_(args[i])
        }
    }
    js = js + ")"

    return JsObject.wrap(js)
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
