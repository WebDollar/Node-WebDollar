import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import BufferExtended from "common/utils/BufferExtended";


class PoolDataMinerInstance {

    constructor(miner, socket){

        this.miner = miner;

        this.hashesPerSecond = 500;
        this.socket = socket;

        this.work = undefined;
        this.lastBlockInformation = undefined;

    }

    destroyPoolDataMinerInstance(){
        this.miner = undefined;
        this.lastBlockInformation = undefined;
        this.work = undefined;
        this.socket = undefined;
    }

    get address(){
        return this.miner.address;
    }

}

export default PoolDataMinerInstance;