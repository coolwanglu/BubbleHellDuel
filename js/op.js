/*
 * op.js
 * operation codes used in Interpreter
 *
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */

/**
 * @enum {number}
 */
var OP = {
    label:1,
    call:2,
    goto:3,
    trap:4,
    halt:5,
    msg:6,
    return:10,
    restart:11,
    nop:14,
    function:16,
    set_fps:17,
    call_op:18,
    
    invalid:0
};


function BaseOP() {}
Util.extend(BaseOP.prototype, {
    init: function() { },
    on_stage: function(stage) { },
    off_stage: function(stage) { },
    // return how much time are left
    // if > 0, it means the current OP has ended
    update: function(dt) {
        return dt;
    }
});


function SleepOP (ms) {
    this.ms = ms;
}
Util.extend(SleepOP.prototype, new BaseOP(), {
    update: function(dt) {
        if(dt >= this.ms) {
            return dt - this.ms;
        } else {
            this.ms -= dt;
            return 0;
        }
    }
});

function WaitForKeyOP (key_name) {
    this.key_name = key_name;
}
Util.extend(WaitForKeyOP.prototype, new BaseOP(), {
    update: function(dt) {
        if(WLGame.input.is_released(this.key_name))
            return dt;
        else
            return 0;
    }
});

function FuncOP (func, obj) {
    this.update = function(dt) { return func.call(obj, dt); };
}
Util.extend(FuncOP.prototype, new BaseOP());

function MsgOP(msg_list) {
    this.msg_list = msg_list;
    
    this.msg_idx = 0;
    this.char_idx = 0;
}

Util.extend(MsgOP.prototype, new BaseOP(), {
    dialog_frame: document.getElementById('game-dialog-frame'),
    char_interval: 64,
    
    on_stage: function(stage) {
        this.dialog_frame.innerHTML = '';
        this.dialog_frame.style.display='block';
    },
    
    off_stage: function(stage) {
        this.dialog_frame.style.display='none';
    },
    
    update: function(dt) {
        if(this.msg_idx >= this.msg_list.length) {
            // everything has been shown   
            return dt;
        }
        
        var cur_msg = this.msg_list[this.msg_idx];
        if(this.char_idx > cur_msg.length) {
            // current message has been shown
            this.char_idx = 0;
            ++ this.msg_idx;
            WLGame.director.call_op(new WaitForKeyOP('action'));
            return dt;
        }

        this.dialog_frame.innerHTML = cur_msg.slice(0, this.char_idx);
        ++this.char_idx;
        
        if(WLGame.input.is_held('action2')) {
            return 0;
        } else {
            WLGame.director.call_op(new SleepOP(this.char_interval));
            return dt;
        } 
    },
    
});
