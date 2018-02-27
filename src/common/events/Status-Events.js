const EventEmitter = require('events');


class StatusEvents{

    constructor(){

        this.emitter = new EventEmitter();

    }

    emit(a,b){
        return this.emitter.emit(a,b)
    }

    on(a,b){
        return this.emitter.on(a,b);
    }

    once(a,b){
        return this.emitter.once(a,b);
    }

}

export default new StatusEvents();