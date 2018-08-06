import ProcessWorker from "./Process-Worker"

class ProcessWorkerCPP extends ProcessWorker{

    constructor(id, noncesWorkBatch, cores){

        super(id, noncesWorkBatch);
        this.cores = cores;

        this._filename = './dist_bundle/CPU/input.txt';

    }

    _getProcessParams(){

        return this._path+ ' -d 0 -c '+this.cores+ ' -b '+ this.noncesWorkBatch + ' -f ' + this._filename + this.suffix;

    }

    async kill(param){
        console.info("KILL!!");
        return await this._writeWork("0 0");
    }


}

export default ProcessWorkerCPP;