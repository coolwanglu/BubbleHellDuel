/*
 * input.js
 * detect keboard and gamepad inputs
 *
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
function Input() {    
    // init input
    // accumulated state
    var input_state = this.input_state = {}; // input_state[key] = 1 means holding, 0 means released
    this.new_input_state = {};
    // state for the current frame
    this.pressed = {};
    this.released = {};

    // register keys we are interested in
    
    var keyboard_mapping = this.keyboard_mapping = {};
    for(var key_name in Config.key_mapping.keyboard) {
        input_state[key_name] = 0;
        Config.key_mapping.keyboard[key_name].forEach(function(key) {
            keyboard_mapping[key] = {
                name: key_name, 
                count: 0
            };
        });
    }
    
    var gamepad_mapping = this.gamepad_mapping = [];
    for(var key_name in Config.key_mapping.gamepad) {
        input_state[key_name] = 0;
        Config.key_mapping.gamepad[key_name].forEach(function(key) {
            gamepad_mapping.push({
                key: key, 
                name: key_name,
                count: 0
            });
        });
    }
    
    // update and check upon key events
    var self = this;
    document.addEventListener('keydown', function(e) {
        var key_state = self.keyboard_mapping[e.keyCode];
        if(key_state) {
            e.preventDefault();
            if(key_state.count == 0) {
                key_state.count = 1;
                self.pressed[key_state.name] = 1;
                self.input_state[key_state.name] = 1;
            }
        }
    });
    document.addEventListener('keyup', function(e) {
        var key_state = self.keyboard_mapping[e.keyCode];
        if(key_state) {
            e.preventDefault();
            if(key_state.count == 1) {
                key_state.count = 0;
                self.released[key_state.name] = 1;
                self.input_state[key_state.name] = 0;
            }
        }
    });

    /*
    window.addEventListener('gamepadconnected', function(e) {
        self.gamepad_connected = true;
    });
    window.addEventListener('gamepaddisconnected', function(e) {
        self.gamepad_connected = false;
    });
    */
}

Util.extend(Input.prototype, {
    gamepad_connected: true,
    
    update: function(dt) {
        if(this.gamepad_connected) {
            try {
                var gp = navigator.getGamepads 
                    ? navigator.getGamepads()[0]
                    : navigator.webkitGetGamepads()[0];
                var self = this;
                this.gamepad_mapping.forEach(function(entry) {
                    var key = entry.key;
                    var key_name = entry.name;
                    var value = 0;
                    if(typeof key === 'number') {
                        value = gp.buttons[key];
                        if(typeof value === 'object')
                            value = value.pressed;
                    } else {
                        var v1 = key[1];
                        var v2 = gp.axes[key[0]];
                        value = (((v1 < 0) && (v2 < v1)) || ((v1 > 0) && (v2 > v1))) ? 1 : 0;
                    }
                    if(entry.count != value) {
                        entry.count = value;
                        if(value == 1)
                            self.pressed[key_name] = 1;
                        else
                            self.released[key_name] = 1;
                        self.input_state[key_name] = value;
                    }
                });
            } catch (e) {
            }
        }
    },
    
    next_frame: function() {
        for(var k in this.pressed)
            this.pressed[k] = 0;
        for(var k in this.released)
            this.released[k] = 0;
    },
    
    is_held: function(key) {
        return this.input_state[key] == 1;
    },
    
    // query state withint the current frame
    is_pressed: function(key) {
        return this.pressed[key] == 1;
    },
    is_released: function(key) {
        return this.released[key] == 1;
    },
});