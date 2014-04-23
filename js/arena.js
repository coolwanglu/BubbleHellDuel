/*
 * Arena.js
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
function Arena() {
    this.player = new Player({
        x: WLGame.stage_width / 2,
        y: WLGame.stage_height * 0.9,
        shoot_direction: 0,
        dir: 0,
        id: Math.random(),
        instance: new createjs.Sprite(
            new createjs.SpriteSheet({
                framerate: 12,
                images: [WLGame.assets.getResult('reimu')],
                frames: [[115,0,46,96,0,25,44],[0,0,61,96,0,30,44],[0,96,61,96,0,33,44],[61,96,46,112,0,25,60],[107,96,48,99,0,24,47],[61,0,54,96,0,26,44],[155,96,46,96,0,25,44]],
                animations: {
                    idle: [1],
                    focus: [0],
                    release: [1, 6, 'idle']
                }   
            }), 'idle'
        ),
        bullet_lightness: 25,
        bullet_alpha: 0.45
    });
    
    this.enemy = new Player({
        x: WLGame.stage_width / 2,
        y: WLGame.stage_height * 0.1,
        shoot_direction: Math.PI,
        id: 0,
        instance: new createjs.Sprite(
            new createjs.SpriteSheet({
                framerate: 12,
                images: [WLGame.assets.getResult('marisa')],
                frames: [[172,0,62,101,0,27.95,50],[103,303,90,101,0,29.95,50],[150,202,90,101,0,31.95,50],[154,101,70,101,0,21.95,50],[0,0,172,101,0,26.95,50],[0,101,154,101,0,15.95,50],[0,202,150,101,0,19.95,50],[0,303,103,101,0,18.95,50]],
                animations: {
                    idle: [0],
                    focus: [1, 2, false],
                    release: [3, 7, 'idle']
                }   
            }), 'idle'
        ),
    });
    this.enemy.instance.visible = false;
    
    this.player.opponent = this.enemy;
    this.enemy.opponent = this.player;
    
    var hit_disc = this.player_hit_disc = new createjs.Shape();
    hit_disc.graphics.f('white').dc(0,0,this.player.radius);
    hit_disc.visible = false;
    
    this.bg_img = new createjs.Bitmap(WLGame.assets.getResult('bg'));
    
    this.sync_event_buffer = [];
    
    // shoot action
    this.shoot_timer = this.shoot_interval + 1;
    
    this.message_board = new createjs.Text();
    this.message_board.font = '100px Georgia';
    this.message_board.alpha = 0;
    this.message_board.visible = false;
    this.message_board.color = 'white';
    
    var L = {
        new_record: -1,
        normal_end: -2,
        start: -3,
    };
    
    // protocol
    // the protocol is naive, assuming two parties trusting each other
    
    this.enemy_found = false;
    this.round_started = false;
            
    var self = this;
    function check_msg_id(msg) {
        if(self.enemy_found) {
            return msg.id == self.enemy.id;
        } else {
            if(msg.id == self.player.id)
                return false;
            self.enemy_found = true;
            self.enemy.id = msg.id;
            return true;
        }
    }
    this.handle_ping = function (msg) {
        // always answer to ping
        if(!msg.sameUrl) return;
        if(!check_msg_id(msg)) return;
        TogetherJS.send({type:'pong', id:self.player.id}); 
    };

    this.handle_pong = function (msg) {
        if(!msg.sameUrl) return;
        if(!check_msg_id(msg)) return;
        if(self.send_ping_id) {
            clearTimeout(self.send_ping_id);
            self.send_ping_id = null;
        }
    };
    this.handle_ready = function(msg, loopback) {
        if(!loopback && !msg.sameUrl) return;
        
        // it's possible that this is the first message we received
        // also works as pong
        if(!loopback && !check_msg_id(msg)) return;
        
        if(self.round_started)
            return;
        if(msg.count == -1) {
            self.start_fight();
        } else {
            var rt = self.message_board;
            rt.text = (msg.count == 0) ? 'Fight!' : msg.count;
            rt.alpha = 1;
            rt.visible = true;
            var b = rt.getBounds();
            rt.x = WLGame.stage_width / 2 - b.width / 2;
            rt.y = WLGame.stage_height / 2 - b.height / 2;

            createjs.Tween.get(rt, {override: true}).to({alpha:0, visible:false}, 500);
        }
    };
    
    this.handle_sync = function(msg) {
        if(!msg.sameUrl) return;
        if(!check_msg_id(msg)) return;
        if(msg.id != self.player.id)
            self.sync_event_buffer.push(msg); 
    };
    
    TogetherJS.hub.on('ping', this.handle_ping);
    TogetherJS.hub.on('pong', this.handle_pong);
    TogetherJS.hub.on('ready', this.handle_ready);
    TogetherJS.hub.on('sync', this.handle_sync);
    
    // timeline
    Interpreter.call(this, [
        L.start,
        function(dt) {
            // wait for togetherjs
            return window.TJS.ready ? dt : 0;
        },
        
        function(dt) {
            // Initiate handshake
            var self = this;
            this.send_ping_interval = 1000;
            function send_ping() {
                TogetherJS.send({type:'ping', id:self.player.id});
                self.send_ping_interval += 1000;
                self.send_ping_id = setTimeout(send_ping, self.send_ping_interval);
            }
            send_ping();
            
            return dt;
        },
    
        function(dt) {
            // wait for enmey
            if(this.enemy_found) {
                console.log('paired with', this.enemy.id);
                
                // show enemy
                var ei = this.enemy.instance;
                ei.alpha = 0;
                ei.visible = true;
                createjs.Tween.get(ei).to({alpha:1}, 1000);
            
                return dt;
            }
            return 0;
        },
        
        function(dt) {
            //Initiate the game
            if(this.player.id > this.enemy.id) {
                var count = 3;
                var self = this;
                function sendReady() {
                    var msg = {type:'ready',count:count,id:self.player.id};
                    TogetherJS.send(msg);
                    // sometimes we cannot hear the echo
                    self.handle_ready(msg, true);
                    --count;
                    if(count >= -1)
                        setTimeout(sendReady, 1000);
                }
                setTimeout(sendReady, 1000);
            }
            return dt;
        },
        
        this.battle_mainloop,
        
        function(dt) {
            //TODO: clear up, check flag or something
            //TogetherJS.hub.off('sync', this.handle_sync);
        },
        
        
        OP.halt,
    
    ]);
}

Util.extend(Arena.prototype, new Interpreter(), {
    // if the enemy become idle for a while, we can start to recover
    hp_recover_threshold: 3000,
    hp_recover_ratio: 100 / 10000,
     
    on_stage: function(stage) {
        this.stage = stage;
        stage.addChild(this.bg_img);
        stage.addChild(this.player.bullet_layer);
        stage.addChild(this.player.instance);
        stage.addChild(this.player_hit_disc);
        stage.addChild(this.enemy.bullet_layer);
        stage.addChild(this.enemy.instance);
        stage.addChild(this.message_board);
    },
    
    off_stage: function(stage) {
        stage.removeChild(this.bg_img);
        stage.removeChild(this.player.bullet_layer);
        stage.removeChild(this.player.instance);
        stage.removeChild(this.player_hit_disc);
        stage.removeChild(this.enemy.bullet_layer);
        stage.removeChild(this.enemy.instance);
        stage.removeChild(this.message_board);
    },
        
    start_fight: function() {
        console.log('Fight started.');
        this.round_started = true;
        this.round_start_time = Date.now();
        // last (round) time when we have received a sync message
        this.last_sync_time = 0;
        
        var rt = this.message_board;
        rt.alpha = 0;
        createjs.Tween.removeTweens(rt);
    },

    check_player_hit: function() {
        var player = this.player;
        var minr = this.enemy.bullet_min_radius;
        var bs = this.enemy.bullets;
        var hit = false;
        for(var i = 0, l = bs.length; i < l;) {
            var b = bs[i];
            var r = b.radius + this.player.radius;
            var dx = player.x - b.x;
            var dy = player.y - b.y;
            if(dx * dx + dy * dy < r * r) {
                var damage_root = b.radius / minr;
                this.player.hp -= damage_root * damage_root;
                b.off_stage();
                b.recycle();
                hit = true;
                
                bs[i] = bs[l-1];
                --bs.length;
                --l;
            } else {
                ++i;
            }
        }
        return hit;
    },
    process_sync_events: function(dt) {
        var eb = this.sync_event_buffer;
        var e = this.enemy;
      
        for(var i = 0, l = eb.length; i < l; ++i) {
            var msg = eb[i];
            if(!msg.sameUrl)
                continue;
          
            // need to move the boss to the opposite direction
            e.x = WLGame.stage_width - msg.x;
            e.y = WLGame.stage_height - msg.y;
            e.shoot_direction = (msg.d > Math.PI) ? (msg.d - Math.PI) : (msg.d + Math.PI);
            e.hp = msg.hp;
            this.last_sync_time = Math.max(this.last_sync_time, msg.t);
            
            if(msg.f && !e.focused) {
                // don't check releasing, due to possible network delays
                e.focus();
            } else if (!msg.f && e.focused) {
                e.release();
            }
        }
        
        // clear buffer
        eb.length = 0;
    },
    check_local_input: function(dt) {
        var player = this.player;
        player.shoot_direction += player.shoot_angular_speed * dt;
        while(player.shoot_direction > Math.PI * 2)
            player.shoot_direction -= Math.PI * 2;
      
        var move_distance = ((player.focused || player.releasing) ? player.move_speed_focused : player.move_speed) * dt;
        if(player.x > move_distance 
            && WLGame.input.is_held('move_left')) {
            player.x -= move_distance;
        } else if (player.x < WLGame.stage_width - move_distance
            && WLGame.input.is_held('move_right')) {
            player.x += move_distance;
        }
        
        if(player.y > move_distance 
            && WLGame.input.is_held('move_up')) {
            player.y -= move_distance;
        } else if (player.y < WLGame.stage_height - move_distance 
            && WLGame.input.is_held('move_down')) {
            player.y += move_distance;
        }
        
        if(this.round_started) {
            if(WLGame.input.is_held('action')) {
                if(!player.focused && !player.releasing) {
                    player.focus();
                    var hit_disc = this.player_hit_disc;
                    hit_disc.visible = true;
                    hit_disc.alpha = 0;
                    createjs.Tween.get(hit_disc, {override: true}).to({alpha:1}, 1000);
                }
            } else if (player.focused) {
                player.release();
                this.player_hit_disc.visible = false;
            }
        }
    },
    battle_mainloop: function(dt) {
        this.process_sync_events(dt);
        this.check_local_input(dt);
        
        this.player.update(dt);
        this.enemy.update(dt);
        
        this.player_hit_disc.x = Math.round(this.player.x);
        this.player_hit_disc.y = Math.round(this.player.y);
        
        if(this.round_started) {
            this.player.shoot(dt);
            this.enemy.shoot(dt);
            
            if(this.check_player_hit()) {
         
            }
            
            // check recover
            if(this.last_sync_time + this.hp_recover_threshold < Date.now() - this.round_start_time) {
                this.player.hp = Math.min(100, this.player.hp + this.hp_recover_ratio * dt);
            }
        }
    
        var bc1 = this.player.bullets.length;
        var bc2 = this.player.focused_bullets.length;
        var bc3 = this.enemy.bullets.length;
        var bc4 = this.enemy.focused_bullets.length;
        WLGame.debug_hud.message = 'FPS: ' + Math.round(createjs.Ticker.getMeasuredFPS())
            + '\nBubbles: ' + (bc1 + bc2 + bc3 + bc4) + ' (' + bc1 + ' ' + bc2 + ' ' + bc3 + ' ' + bc4 + ')'
            + '\nHP: ' + this.player.hp
            + '\nHP2: ' + this.enemy.hp
        ;
        
        TogetherJS.send({type:'sync', 
                         x:Math.round(this.player.x), 
                         y:Math.round(this.player.y), 
                         d:Math.round(this.player.shoot_direction * 1000)/1000,
                         hp:Math.round(this.player.hp),
                         id:this.player.id,
                         f:(this.player.focused ? 1 : 0),
                         t:Date.now()-this.round_start_time
                        });
        
        return 0;
    }, 
    
});