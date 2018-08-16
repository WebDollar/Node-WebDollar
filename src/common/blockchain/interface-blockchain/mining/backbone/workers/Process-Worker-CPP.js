/**
 * CPP miner - compiled in C
 */

import ProcessWorker from "./Process-Worker"

class ProcessWorkerCPP extends ProcessWorker{

    constructor(id, noncesWorkBatch, cores){

        super(id, noncesWorkBatch, false);
        this.cores = cores;

    }

    _getProcessParams(){

        return this._path+ ' -d 0 -c '+this.cores+ ' -b '+ this.noncesWorkBatch + ' -f ' + this._outputFilename + this.suffix;

    }

    async kill(param){
        console.info("KILL!!");
        return await this._writeWork("0 0");
    }


}

export default ProcessWorkerCPP;