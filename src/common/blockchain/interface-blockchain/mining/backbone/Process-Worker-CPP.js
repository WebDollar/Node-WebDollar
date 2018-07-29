import ProcessWorker from "./Process-Worker"

class ProcessWorkerCPP extends ProcessWorker{

    constructor(id, noncesWorkBatch, cores){

        super(id, noncesWorkBatch);
        this.cores = cores;

        this._filename = './dist_bundle/CPU/input.txt';

    }

    _getProcessParams(){

        return this._path+ ' -c '+this.cores+ ' -b '+ this.noncesWorkBatch + ' -f ' + this._filename + this.suffix;

    }

}

export default ProcessWorkerCPP;