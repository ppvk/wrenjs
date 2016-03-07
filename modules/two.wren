import "js" for JsObject, JS

var elem = JsObject.wrap("document.getElementById('canvas')")

var params = {
  "width": 285,
  "height": 200
}

var two = JsObject.new("Two", [params])
two.callMethod("appendTo", [elem]).free()

var circle = two.callMethod("makeCircle", [72, 100, 50])

System.print(circle["fill"].string)
JS.log(circle["fill"])

circle["fill"] = "#FF8000"
circle["stroke"] = "orangered"
circle["linewidth"] = 5

JS.log(two.callMethod("update"))
