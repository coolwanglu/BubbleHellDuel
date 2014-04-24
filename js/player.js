/*
 * player.js
 *
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
function Player(config) {
    Util.extend(this, config);
    this.bullets = [];
    this.focused_bullets = [];
    this.bullet_layer = new createjs.Container();
    this.bullet_pool = new BulletPool();
    this.update_instance();

    var self = this;
    this.instance.addEventListener('animationend', function(e) {
        if(e.name == 'release') {
            self.releasing = false;
        }
    });
}

Player.prototype = {
    shoot_interval: 50,
    shoot_angular_speed: Math.PI / 1000,
    shoot_count: 3,
    shoot_timer: 0,
    shoot_direction: 0,

    move_speed: 0.2,
    move_speed_focused: 0.06,

    bullet_speed: 0.128,
    bullet_min_radius: 5,
    bullet_max_radius: 20,
    bullet_lightness: 50,
    bullet_alpha:0.9,

    focused_shoot_interval: 100,
    focused_bullet_radius: 5,
    focused_bullet_angular_speed: Math.PI / 1000,
    // don't make it too fast, or it could pass the opponent without hitting it.    
    focused_bullet_release_speed: 0.5,
    focused_bullet_count_limit: 30,
    focused_bullet_damage: 5,

    // this is not the actual pixel, see update_bullets()
    focused_circle_radius: 7,

    radius: 5,
    // bullets that are outside the screen but within this distance are kept
    stage_margin: 100,

    hp: 100,
    max_hp: 100,
    focused: false,
    // cannot focus during the release animation
    releasing: false,
    dead: false,

    update_bullets: function(dt) {
        var m = this.stage_margin;
        var sw = WLGame.stage_width;
        var sh = WLGame.stage_height;
        var bl = this.bullets;
        for(var i = 0, l = bl.length; i < l; ) {
            var b = bl[i];
            b.update_physics(dt);
            b.update_graphics();
            if((b.x < -m) || (b.x > sw + m)
               || (b.y < -m) || (b.y > sh + m)) {
                b.off_stage();
                b.recycle();
                // remove b from bl
                bl[i] = bl[l-1];
                --bl.length;
                --l;
            } else {
                ++i;
            }
        }

        // update focused bullets
        // they don't disappear when off stage
        var fbl = this.focused_bullets;

        var fbas = this.focused_bullet_angular_speed;
        var fcr = this.focused_circle_radius;
        for(var i = 0, l = fbl.length; i < l; ++i) {
            var b = fbl[i];
            b.life_time += dt;
            // focused bullets are rotating in the opposite direction
            b.revolution_angle -= fbas * dt;
            var r = Math.log(1+b.life_time) * fcr;

            b.x = this.x + r * Math.cos(b.revolution_angle);
            b.y = this.y + r * Math.sin(b.revolution_angle);
            b.update_graphics();
        }
    },

    focus: function() {
        this.focused = true;
        this.instance.gotoAndPlay('focus');
    },

    release: function() {
        this.focused = false;
        this.releasing = true;
        this.instance.gotoAndPlay('release');

        // release focused bullets: convert them into normal ones
        var fbs = this.focused_bullets;
        var ox = this.opponent.x;
        var oy = this.opponent.y;
        for(var i = 0, l = fbs.length; i < l; ++i) {
            var b = fbs[i];
            var dx = ox - b.x;
            var dy = oy - b.y;
            var dr = Math.sqrt(dx * dx + dy * dy);
            var fbrs = this.focused_bullet_release_speed * (1+Math.random());
            if(Math.abs(dr) < Const.EPS) {
                var dir = Math.random() * Math.PI * 2;
                b.vx = fbrs * Math.cos(dir);
                b.vy = fbrs * Math.sin(dir);
            } else {
                b.vx = fbrs * dx / dr;
                b.vy = fbrs * dy / dr;
            }
            this.bullets.push(b);
        }
        fbs.length = 0;
    },

    shoot: function(dt) {
        this.shoot_timer += dt;
        if(this.focused) {
            while(this.shoot_timer > this.focused_shoot_interval) {

                // we will add this.shoot_count new bullets below
                // assuming this.shoot_count is not super large
                // this would be fine

                if(this.focused_bullets.length >= this.focused_bullet_count_limit) {
                    this.shoot_timer = 0;
                    return;
                }

                this.shoot_timer -= this.focused_shoot_interval;
                var bp = this.bullet_pool;
                var fr = this.focused_bullet_radius;
                var t = Date.now();
                var direction = this.shoot_direction;

                for(var i = 0; i < this.shoot_count; ++i) {
                    var b = this.bullet_pool.get();

                    // the position of focused bullets is handled by the shooter
                    // so vx and vy are not necessary
                    Util.extend(b, {
                        x: this.x,
                        y: this.y,
                        life_time: 0,
                        radius: fr,
                        damage: this.focused_bullet_damage,
                        revolution_angle: direction
                    });
                    b.instance.graphics.c()
                        .f(createjs.Graphics.getRGB(0,255,255,0.2)).de(-2*fr-1,-fr-1,4*fr+2,2*fr+2)
                        .f('cyan').de(-2*fr,-fr,4*fr,2*fr)
                        .f('white').de(-2*fr+1,-fr+1,4*fr-2,2*fr-2);
                    b.instance.cache(-2*fr-1, -fr-1, 4*fr+2, 2*fr+2);
                    b.instance.rotation = Math.random() * 360;
                    b.instance.alpha = Math.random() * 0.5 + 0.5;

                    b.on_stage(this.bullet_layer);
                    this.focused_bullets.push(b);

                    direction += Math.PI * 2 / this.shoot_count;
                }
            }
        } else {
            while(this.shoot_timer > this.shoot_interval) {
                // normal bullets
                this.shoot_timer -= this.shoot_interval;
                var direction = this.shoot_direction;
                var bp = this.bullet_pool;
                for(var i = 0; i < this.shoot_count; ++i) {
                    var b = this.bullet_pool.get();
                    // init new bullet

                    var r = this.bullet_min_radius + Math.random() * (this.bullet_max_radius - this.bullet_min_radius);

                    b.instance.graphics.c()
                        .ss(2).s('white')
                        .f(createjs.Graphics.getHSL(Date.now() % 2000 / 2000.0 * 360, 100, this.bullet_lightness))
                        .dc(0,0,r-1);
                    b.instance.cache(-r-1, -r-1, 2*r+2, 2*r+2);

                    b.instance.alpha = this.bullet_alpha;

                    var sqrt2 = Math.sqrt(2.0);
                    var speed = this.bullet_speed * (1+(1+Math.cos(Date.now() % 2000))/2);
                    Util.extend(b, {
                        x: this.x,
                        y: this.y,
                        vx: speed * Math.cos(direction),
                        vy: speed * Math.sin(direction),
                        damage: r * r / this.bullet_min_radius / this.bullet_min_radius,
                        radius: r
                    });

                    b.on_stage(this.bullet_layer);
                    this.bullets.push(b);

                    direction += Math.PI * 2 / this.shoot_count;
                }
            }
        }
    },
    update_instance: function(dt) {
        this.instance.x = Math.round(this.x);
        this.instance.y = Math.round(this.y);
    },
    update: function(dt) {
        this.update_bullets(dt);
        this.update_instance(dt);
    }
};
