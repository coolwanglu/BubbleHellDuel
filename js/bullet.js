/*
 * bullet.js
 * Constantly moving
 * Ignoring gravity
 * No Acceleration
 * Pooling
 *
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
function Bullet(config) {
    this.instance = new createjs.Shape();
}

Util.extend(Bullet.prototype, {
    instance: null,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    
    on_stage: function(stage) {
        stage.addChild(this.instance);
    },
    
    off_stage: function() {
        var instance = this.instance;
        if(instance.parent) {
            instance.parent.removeChild(instance);
        }
    },
    
    recycle: function() {
        this.pool.put(this);
    },
    
    update_physics: function(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    },

    update_graphics: function() {
        this.instance.x = Math.round(this.x);
        this.instance.y = Math.round(this.y);
    }
});

function BulletPool() {
    this.bullet = function() {
        Bullet.apply(this, arguments);
    }
    Util.extend(this.bullet.prototype, Bullet.prototype);
    this.bullet.prototype.pool = this;
    this.pool = [];
}

Util.extend(BulletPool.prototype, {
    put: function(bullet) {
        this.pool.push(bullet);
    },
    
    get: function() {
        var b;
        if(this.pool.length > 0) {
            return this.pool.pop();
        } else {
            return new this.bullet();
        }
    },
});