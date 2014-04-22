/*
 * Constantly moving object
 * Ignoring gravity
 * No Acceleration
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
    hb_hw: 0, // half width of hitbox
    hb_hh: 0, // half height of hitbox
    colliding_mask: 0,
    colliding_group: 0,
    
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
    
    get_hitbox: function() {
        return {
            x: this.x,
            y: this.y,
            hw: this.hb_hw,
            hh: this.hb_hh
        };
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