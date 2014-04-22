function Director(InitialOP, stage) {
    this.cur_entry = {
        op: InitialOP
    };
    this.stage = stage;
}

Util.extend(Director.prototype, {
    cur_entry_changed: false,
    
    call_op: function(op) {
        this.cur_entry_changed = true;
        this.cur_entry = {
            op: op,
            next: this.cur_entry
        };
    },
    
    update: function(dt) {
        try{
            while(true) {
                var entry = this.cur_entry;
                if(!entry) {
                    Util.error('Director done');
                    return dt;
                }

                if(!entry.on_stage) {
                    entry.op.on_stage(this.stage);
                    entry.on_stage = true;
                }

                dt = entry.op.update(dt); 

                if(dt <= 0)
                    return dt;

                if(this.cur_entry_changed) {
                    this.cur_entry_changed = false;
                    continue;
                }
                entry.op.off_stage(this.stage);

                this.cur_entry = entry.next; 
            } 
        } catch(e) {
            console.log('Director dump:')
            console.log(this.cur_entry);
            console.log(e.stack);
            Util.error('error');
        }
    }    
});