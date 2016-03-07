import "js" for JsObject, JS

var elem = JsObject.wrap("document.getElementById('canvas')")

var params = {
  "width": 285,
  "height": 200
}

var two = JsObject.new("Two", [params.toString])
two.callMethod("appendTo", [elem.native])

JS.log(two)

var circle = two.callMethod("makeCircle", [72, 100, 50], true)

JS.log(circle)

circle["fill"] = "'#FF8000'"
circle["stroke"] = "'orangered'"
circle["linewidth"] = "5"

JS.log( circle["linewidth"] )

two.callMethod("update")
