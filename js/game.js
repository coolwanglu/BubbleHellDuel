function Game(queue) { 
    this.assets = queue;
}

Game.prototype.run = function() {
    console.log('Game starts.');
    
    this.game_container = document.getElementById('game-container');
    
    var stage = this.stage = new createjs.Stage("game-canvas1");
    this.stage_width = stage.canvas.width;
    this.stage_height = stage.canvas.height;
    
    var input = this['input'] = this.input = new Input();
  
    // set up a layer such that debug_hud is always on top of it
    var layer = new createjs.Container();
    stage.addChild(layer);
    var director = this['director'] = this.director = new Director(new Arena(), layer);

    var debug_hud = this.debug_hud = new DebugHud();
    debug_hud.on_stage(stage);
    
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener('tick', function(e) {
        if(e.paused)
            return;
        
        var dt = e.delta;
        
        input.update(dt);
        director.update(dt);
        debug_hud.update(dt);
        
        // need to pass the event in order to make SpriteSheet.framerate work
        stage.update(e);
        
        input.next_frame();
    });
};
    
// for closure compiler
window['Game']=Game;
window['Game'].prototype['run'] = Game.prototype.run;