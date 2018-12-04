/**
 * CPP miner - compiled in C
 */

import Blockchain from "main-blockchain/Blockchain"
import ProcessWorker from "./Process-Worker"

const uuid = require('uuid');

class ProcessWorkerCPP extends ProcessWorker{

    constructor(id, noncesWorkBatch, cores){

        super(id, noncesWorkBatch, false);
        this.cores = cores;

        this._outputFilename = this._outputFilename+Math.random();

    }

    _getProcessParams(){

        return this._path+ ' -d 0 -c '+this.cores+ ' -b '+ this.noncesWorkBatch + ' -f ' + this._outputFilename + this.suffix;

    }

    async kill(param){

        console.info("KILL!!");
        await this._writeWork("0 0");
        await Blockchain.blockchain.sleep(5000);

        ProcessWorker.prototype.kill.call( this );
    }

    // async restartWorker(){
    //
    //     this._is_batching = false;
    //
    //     await this._writeWork("0 0");
    //
    //     return await Blockchain.blockchain.sleep(5000);
    // }


}

export default ProcessWorkerCPP;