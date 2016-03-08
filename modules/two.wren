import "js" for JsObject, JS

var elem = JsObject.wrap("document.getElementById('canvas')")

var two = JsObject.new("Two", [{
  "width": 285,
  "height": 200
}]).callMethod("appendTo", [elem])

var circle = two.callMethod("makeCircle", [-70, 0, 50])
var rect = two.callMethod("makeRectangle", [70, 0, 100, 100])

circle["fill"] = "#FF8000"
rect["fill"] = "rgba(0, 200, 255, 0.75)"

var group = two.callMethod("makeGroup", [circle, rect])
group.callMethod("noStroke")
group["translation"].callMethod("set", [two["width"] / 2, two["height"] / 2])
group["scale"] = 0.75

two.callMethod("update")
