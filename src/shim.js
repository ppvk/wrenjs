
Wren = {
    WREN_OBJECTS: {},
    CURRENT_INDEX: 1,
    VM_MAP: {},

    shimNewVM: Module.cwrap('shimNewVM', 'number'),
    shimFreeVM: Module.cwrap('wrenFreeVM', null, ['number']),
    interpret: Module.cwrap('wrenInterpret', 'number', ['number', 'string']),

    newVM: function(wrenVM) {
        var c_vm = Wren.shimNewVM();
        Wren.VM_MAP[c_vm] = wrenVM;
        return c_vm;
    },

    freeVM: function(c_vm) {
        Wren.shimFreeVM(c_vm);
        Wren.VM_MAP[c_vm] = null;
    },

    writeFn: function(c_vm, string) {
        Wren.VM_MAP[c_vm].writeFn(string);    
    }
};

/* Constructor */
WrenVM = function(disallowJS) {
    this._vm = Wren.newVM(this);

    // This makes it impossible for the 'main' script to use the JS module.
    if (disallowJS) {
        this.interpret('class JS {}');    
        this.interpret('class JsObject {}');    
    }
};

/* Static properties */
WrenVM.module = {}; 

/* Methods */
WrenVM.prototype.freeVM = function() {
    Wren.freeVM(this._vm);
};

WrenVM.prototype.writeFn = function(string) {
    console.log(string);
};

WrenVM.prototype.interpret = function(wren) {
    var code = Wren.interpret(this._vm, wren);
    // 0 is good
    return code;
}

/* Static Methods */
WrenVM.loadPageModules = function() {
    var imp = document.querySelectorAll('[type="language/wren"]');
    for (var i = imp.length -1 ; i >= 0 ; i--) {
        if (imp[i].hasAttribute('src')) {      
            var url = imp[i].getAttribute('src');
            var module = imp[i].getAttribute('module');  
            var file = new XMLHttpRequest();
            file.onreadystatechange = function() {
                if (file.readyState === 4) {
                    if (file.status === 200) {
                        WrenVM.module[module] = file.responseText;
                    }
                }
            }
            file.open("GET", url, false);
            file.send(null);
        }
    }
}


WrenVM._lookup = function(id) {
    return Wren.WREN_OBJECTS[id];
};

WrenVM._register = function(object) {
    Wren.WREN_OBJECTS[Wren.CURRENT_INDEX] = object;
    Wren.CURRENT_INDEX++;
    return Wren.CURRENT_INDEX - 1;
};

WrenVM._free = function(id) {
    Wren.WREN_OBJECTS[id] = null;
};

