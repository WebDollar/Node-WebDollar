const EventEmitter = require('events');

class AdvancedEmitter{

    constructor(){

        this._emitter = new EventEmitter();
        this._emitter.setMaxListeners(100);

        this._events = this._emitter._events;
        this.emit = this._emitter.emit.bind(this._emitter);
    }

    on(a, call){

        this._emitter.on(a, call);

        return ()=>{ this._emitter.removeListener(a, call); };
    }

}

export default AdvancedEmitter;