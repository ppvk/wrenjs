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
  }
  call() {
    JS.run("Wren.call(" + _id + ")")
  }
  call(method) {
    JS.run("Wren.callMethod(" + _id + ", '" + method + "')")
  }
  free() {
    JS.run("Wren.free(" + _id + ")")
  }
}
