class JS {
    foreign static run(string)
    foreign static getString(string)
    foreign static getInt(string)

    static getObject(string) {
      return new JsObject(string)
    }
}

class JsObject {
  new(js) {
    _id = JS.getInt("Wren.register(" + js + ")")
    _reference = "Wren.lookup(" + _id.toString + ")"
  }

  native {
    return _reference
  }

  call() {
    var js = _reference + "()"
    JS.run(js)
  }
  call(args) {
    var js = _reference + "("
    js = js + args[0].toString
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js + "," + args[i].toString
        }
    }
    js = js + ")"

    JS.run(js)
  }

  callMethod(method) {
    var js = _reference + "." + method + "()"
    JS.run(js)
  }
  callMethod(method, args) {
    var js = _reference + "." + method + "("
    js = js + args[0].toString
    if (args.count > 1) {
        for ( i in 1..(args.count-1) ) {
          js = js+ "," + args[i].toString
        }
    }
    js = js + ")"
    JS.run(js)
  }

  free() {
    JS.run("Wren.free(" + _id.toString + ")")
  }
}
