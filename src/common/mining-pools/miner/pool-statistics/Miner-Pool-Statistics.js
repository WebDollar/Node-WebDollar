const EventEmitter = require('events');

class MinerPoolStatistics{

    constructor(minerPoolManagement){

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.minerPoolManagement = minerPoolManagement;

        this._poolHashes = 0;
        this._poolMinersOnline = 0;

    }

    set poolHashes(newValue){

        if (this._poolHashes === newValue) return;

        this._poolHashes = newValue;
        this.emitter.emit("miner-pool/statistics/update", { poolHashes: this._poolHashes, poolMinersOnline: this._poolMinersOnline });
    }

    get poolHashes(){
        return this._poolHashes;
    }

    set poolMinersOnline(newValue){

        if (this._poolMinersOnline === newValue) return;

        this._poolMinersOnline = newValue;
        this.emitter.emit("miner-pool/statistics/update", { poolHashes: this._poolHashes, poolMinersOnline: this._poolMinersOnline });
    }

    get poolMinersOnline(){
        return this._poolMinersOnline;
    }


}

export default MinerPoolStatistics;