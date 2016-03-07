import "js" for JsObject, JS

var elem = JsObject.wrap("document.getElementById('canvas')")

var params = {
  "width": 285,
  "height": 200
}

JS.log(elem)

var two = JsObject.new("Two", [params])

JS.log(two)

two.callMethod("appendTo", [elem])
var circle = two.callMethod("makeCircle", [72, 100, 50])

System.print(circle["fill"].string)
JS.log(circle["fill"])

circle["fill"] = "#FF8000"
circle["stroke"] = "orangered"
circle["linewidth"] = 5

JS.log(two.callMethod("update"))
