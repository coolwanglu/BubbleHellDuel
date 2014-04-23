/*
 * debug_hud.js
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
function DebugHud () {
    var message_area = this.message_area = new createjs.Text("FPS: 0");
    message_area.x = 50;
    message_area.y = 50;
    message_area.color = 'yellow';
    message_area.font = '13px Georgia';
    this.message = '';
}

Util.extend(DebugHud.prototype, {
    on_stage: function(stage) {
        stage.addChild(this.message_area);
    },
    
    update: function(dt) {
         this.message_area.text = this.message;
    }
});

