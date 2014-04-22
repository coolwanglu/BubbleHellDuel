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
    
    // return the closest point to x in [a,b]
    range: function(x, a, b) {
        return (x < a) ? a :((x > b) ? b : x);
    },
    
    error: function(msg) {
        console.error(msg);
        createjs.Ticker.setPaused(true);
        throw msg;
    },
    
    // create an instace of a vector symbol (exported from Flash)
    // and properly cache it
    get_cached_obj: function(sym) {
        var obj = new sym();
        var rect = obj.nominalBounds;
        obj.cache(rect.x, rect.y, rect.width, rect.height);
        return obj;
    },
    
    // the position of the bbox is relative to the game container
    get_bbox_of_dom_obj: function(obj) {
        var rect = obj.getBoundingClientRect();
        var rect1 = WLGame.game_container.getBoundingClientRect();
        return {
            x: rect.left - rect1.left,
            y: rect.top - rect1.top,
            width: rect.width,
            height: rect.height
        };
    }
};