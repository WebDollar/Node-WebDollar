const EventEmitter = require('events');
import consts from "consts/const_global";

class AdvancedEmitter{

    constructor(maxListeners = 100){

        this._emitter = new EventEmitter();
        this._emitter.setMaxListeners(maxListeners);

        this._events = this._emitter._events;

        this.emit = this._emitter.emit.bind(this._emitter);

        this.emitter = this._emitter;

    }

    emit(){

        let answer;
        try{
            answer = this._emitter.emit.apply(this, arguments);
        } catch (exception){
            if (consts.DEBUG)
                console.error("Emit raised an error", exception);
        }

        return answer;
    }

    on(a, call){

        this._emitter.on(a, (...args)=>{
            try{
                call(...args);
            }catch(exception){
                if (consts.DEBUG)
                    console.error("On raised an error", exception);
            }
        });

        return ()=> this._emitter.removeListener(a, call);
    }

    once(a, call){

        this._emitter.once(a, (...args)=>{
            try{
                call(...args);
            }catch(exception){
                if (consts.DEBUG)
                    console.error("Once raised an error", exception);
            }
        });

        return () => this._emitter.removeListener(a, call);
    }

}

export default AdvancedEmitter;