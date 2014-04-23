/*
 * util.js
 * handy functions
 *
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
var Util = {
    extend: function() {
        if(arguments.length == 0) return {};
        var dst = arguments[0];
        for(var i = 0, l = arguments.length; i < l; ++i) {
            var src = arguments[i];
            for(var k in src)
                dst[k] = src[k];
        }
        return dst;
    }, 
    
    error: function(msg) {
        console.error(msg);
        createjs.Ticker.setPaused(true);
        throw msg;
    },
};