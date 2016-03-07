class JS {
    foreign static run_(string)
    foreign static string_(string)
    foreign static num_(string)
    foreign static bool_(string)

    static log(jsObject) {
        JS.run_("console.log(" + jsObject.native + ")")
    }
}

class JsObject {
  construct new(js) {
    _id = JS.num_("WrenVM._register( new " + js + "() )")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  construct new(js, args) {
    js = "new " + js + "("
    js = js + args[0].toString
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + args[i].toString
        }
    }
    js = js + ")"
    _id = JS.num_("WrenVM._register(" + js + ")")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  construct wrap(js) {
    _id = JS.num_("WrenVM._register(" + js + ")")
    _reference = "WrenVM._lookup(" + _id.toString + ")"
  }

  free() {
    JS.run_("WrenVM._free(" + _id.toString + ")")
  }

  native {
    return _reference
  }

  [property] {
    return JsObject.wrap(native + "." + property)
  }

  [property]= (value) {
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
      return JsObject.wrap(js)
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
      return JsObject.wrap(js)
    } else {
      JS.run_(js)
    }
  }

  callMethod(method, args) {
    callMethod(method, args, false)
  }

  callMethod(method) {
    var js = _reference + "." + method + "()"
    JS.run_(js)
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
