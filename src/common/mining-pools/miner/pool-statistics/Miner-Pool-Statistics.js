const EventEmitter = require('events');

class MinerPoolStatistics{

    constructor(minerPoolManagement){

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.minerPoolManagement = minerPoolManagement;

        this._poolHashes = 0;
        this._poolMinersOnline = 0;
        this._poolBlocksConfirmed = 0;
        this._poolBlocksUnconfirmed = 0;

    }

    set poolHashes(newValue){

        if (this._poolHashes === newValue) return;

        this._poolHashes = newValue;
        this._emitNotification();
    }

    get poolHashes(){
        return this._poolHashes;
    }

    set poolMinersOnline(newValue){

        if (this._poolMinersOnline === newValue) return;

        this._poolMinersOnline = newValue;
        this._emitNotification();
    }

    get poolMinersOnline(){
        return this._poolMinersOnline;
    }

    set poolBlocksConfirmed(newValue){

        if (this._poolBlocksConfirmed === newValue) return;

        this._poolBlocksConfirmed = newValue;
        this._emitNotification();
    }

    get poolBlocksConfirmed(){
        return this._poolBlocksConfirmed;
    }

    set poolBlocksUnconfirmed(newValue){

        if (this._poolBlocksUnconfirmed === newValue) return;

        this._poolBlocksUnconfirmed = newValue;
        this._emitNotification();
    }

    get poolBlocksUnconfirmed(){
        return this._poolBlocksUnconfirmed;
    }

    _emitNotification(){
        this.emitter.emit("miner-pool/statistics/update", { poolHashes: this._poolHashes, poolMinersOnline: this._poolMinersOnline, poolBlocksConfirmed: this.poolBlocksConfirmed, poolBlocksUnconfirmed: this.poolBlocksUnconfirmed });
    }

}

export default MinerPoolStatistics;