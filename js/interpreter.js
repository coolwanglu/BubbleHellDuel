/*
Description of the scripting engine

the input is a series of OP's

the runtime consists of pointers to the current OP and  the current scene

current scene is the common context for a group of OP, 
it can be replace with new scene, or save/restore via push/pop

 */

function Interpreter (script) {
    this.script = script ? script.slice(0) : [];
    this.script.push(OP.halt);
    this.pre_process();
    this.restart();
}

Util.extend(Interpreter.prototype, new BaseOP(), {
    // whether to automatically increased op_idx by 1
    // should be disabled for jumps
    inc_op_idx: true,
    
    on_stage: function(stage) {
        this.stage = stage;
    },
    restart: function() {
        this.op_idx = -1;
        this.stack = [];
    },
    
    update: function(dt) {
        var op = this.next_op();
        if(op)
            WLGame.director.call_op(op);
        return dt;
    },
    
    next_op: function() {
        // find the next OP, and throw it to the director
        while(true) {
            if(this.inc_op_idx)
                ++ this.op_idx;
            else
                this.inc_op_idx = true;
            
            var op = this.script[this.op_idx];
            if(!op) {
                Util.error('Invalid op_idx: ' + this.op_idx);
                return dt;
            }
       
            // evaluate functional args
            if(op[0] != OP.function
              && op[0] != OP.call_op) {
                for(var i = 1, l = op.length; i < l; ++i) {
                    if(typeof op[i] === 'function')
                        op[i] = op[i].call(this);
                }
            }
            
          
            switch(op[0]) {
                case OP.label:
                    // do nothing
                    break;
                case OP.call:
                    this.call_label(op[1]);
                    break;
                case OP.goto:
                    this.goto_label(op[1]);
                    break;
                case OP.trap:
                    Util.error('trapped ' + this.op_idx);
                    break;
                case OP.halt:
                    return null;
                case OP.msg:
                    return new MsgOP(op.slice(1));
                case OP.return:
                    this.op_idx = this.stack.pop();
                    this.inc_op_idx = false;
                    break;
                case OP.restart:
                    this.restart();
                    break;
                case OP.nop:
                    break;
                case OP.function:
                    return new FuncOP(op[1], this);
                case OP.set_fps:
                    createjs.Ticker.setFPS(op[1]);
                    break;
                case OP.call_op:
                    return new op[1];
                default:
                    Util.error('Unknown op: ' + op);
                    break;
            }
        }
    },
    
    call_label: function(label) {
        this.stack.push(this.op_idx + 1);
        this.goto_label(label);
    },
    
    goto_label: function(label) {
        if(!(label in this.labels)) {
            Util.error('Unknown label: ' + label);
            return;
        }
        this.op_idx = this.labels[label];
        this.inc_op_idx = false;
    },
    
    pre_process: function() {
        var script = this.script;
        // canonicalize
        for(var i = 0, l = script.length; i < l; ++i) {
            var s = script[i];
            if(typeof s == 'number') {
                if(s < 0) {
                    // labels are negative integers
                    script[i] = [OP.label, s];
                } else {
                    // shorthand OP
                    script[i] = [s];
                }
            } else if (typeof s == 'function') {
                script[i] = [OP.function, s]
            }
        }
        
        // build label lookup table
        this.labels = {};
        
        for(var i = 0, l = script.length; i < l; ++i) {
            if(script[i][0] == OP.label) {
                var label = script[i][1];
                if(label in this.labels)
                    Util.error('Duplicated labels: ' + label);
                this.labels[label] = i;
            }
        }
    }
    
});