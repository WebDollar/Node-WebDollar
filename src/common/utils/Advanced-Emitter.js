const EventEmitter = require('events');

class AdvancedEmitter{

    constructor(){

        this._emitter = new EventEmitter();
        this._emitter.setMaxListeners(100);

        this.emit = this._emitter.emit.bind(this._emitter);
    }

    on(a, call){

        this._emitter.on(a, call);

        return ()=>{ this._emitter.removeListener(a, call); };
    }


}

export default AdvancedEmitter;