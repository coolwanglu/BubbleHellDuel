/*
 * hp_bar.js
 *
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */

function HPBar (config) {
    var player = this.player = config.player;
    this.cached_hp = player.hp;
    var instance = this.instance = new createjs.Shape();

    var flipped = config.flipped
    instance.graphics.f(config.color).r(
        (flipped ? -config.width : 0),
        (flipped ? 0 : -config.height),
        config.width, config.height);
    instance.cache(
        (flipped ? -config.width : 0),
        (flipped ? 0 : -config.height),
        config.width, config.height);
    instance.x = config.x;
    instance.y = config.y;
    instance.scaleX = player.hp / player.max_hp;
}

Util.extend(HPBar.prototype, {
    animation_duration: 500 ,
    
    update: function(dt) {
        var player = this.player;
        if(player.hp != this.cached_hp) {
            this.cached_hp = player.hp;
            createjs.Tween.get(this.instance, {override:true})
                .to({scaleX: player.hp / player.max_hp}, this.animation_duration);
        }
    },
});