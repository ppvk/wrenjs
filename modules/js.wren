class JS {
    foreign static run_(string)
    foreign static string_(string)
    foreign static num_(string)
    foreign static bool_(string)

    // JS.wrap() is a smaller way of calling
    static wrap(string) {
      return JsObject.new(string)
    }
    static log(jsObject) {
        JS.run_("console.log(" + jsObject.native + ")")
    }
}

class JsObject {
  construct new(js) {
    _id = JS.num_("WrenVM._register(" + js + ")")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  free() {
    JS.run_("WrenVM._free(" + _id.toString + ")")
  }

  native {
    return _reference
  }

  property(string) {
    return JS.wrap(native + "." + string)
  }

  setProperty(property, value) {
    JS.run_(_reference + "." + property + " = " + value)
  }

  call(args, returnsObject) {
    var js = _reference + "("
    js = js + args[0].toString
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + args[i].toString
        }
    }
    js = js + ")"

    if (returnsObject) {
      return JsObject.new(js)
    } else {
      JS.run_(js)
    }
  }

  call(args) {
    call(args, false)
  }

  callMethod(method, args, returnsObject) {
    var js = _reference + "." + method + "("
    js = js + args[0].toString
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + args[i].toString
        }
    }
    js = js + ")"

    if (returnsObject) {
      return JsObject.new(js)
    } else {
      JS.run_(js)
    }
  }

  callMethod(method, args) {
    callMethod(method, args, false)
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
