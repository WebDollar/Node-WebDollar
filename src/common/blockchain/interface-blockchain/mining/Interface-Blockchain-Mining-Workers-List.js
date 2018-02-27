import StatusEvents from "common/events/Status-Events";

class InterfaceBlockchainMiningWorkersList{

    constructor(mining){

        this.mining = mining;

        this._workersList = [];

        this.WORKERS_MAX = 20;

        this.block = undefined;
        this.difficultyTarget = undefined;

        this.workers = 0; // browser webWorkers, backbone cores

    }

    addWorkers(number){

        if (number === 0)
            return false;

        this.workers += number;

        if (this.workers <= 0)
            this.workers = 0;
        if (this.workers > this.WORKERS_MAX)
            this.workers = this.WORKERS_MAX;

        StatusEvents.emit('mining/workers-changed', this.workers);
    }

    initializeWorkerFirstTime(worker){

        worker.suspended = false;
        worker.postMessage( {message: "initialize-algorithm"} );

    }

    _initializeWorker(worker){
        worker.suspended = false;
        worker.postMessage({message: "initialize", block: this.block, nonce: this.mining._nonce , count: this.mining.WORKER_NONCES_WORK });

        this.mining._nonce += this.mining.WORKER_NONCES_WORK;
        this.mining._hashesPerSecond += this.mining.WORKER_NONCES_WORK;
    }

    initializeWorkers(block, difficultyTarget){

        //initialize new workers
        this.block = block;
        this.difficultyTarget = difficultyTarget;

        //initialize new workers
        for (let i=0; i<this._workersList.length; i++)
            this._initializeWorker(this._workersList[i]);
    }

    createWorkers(){

        while (this._workersList.length < this.workers) {
            console.log("createWorkers");
            let worker = this.createWorker();
            this.initializeWorkerFirstTime(worker);
        }
    }

    decreaseWorkers(){
        if (this.workers < 0) //can not be < 0 workers
            this.workers = 0;

        for (let i = this._workersList.length - 1; i > this.workers - 1; i--)
            this.terminateWorker(this._workersList[i]);

        this._workersList.splice(this.workers-1);
    }

    reduceWorkers(){

        if (this._workersList.length < this.workers)
            return;

        //be sure we didn't skip anything

        console.log("reduce workers");

        this.mining._nonce -= this.mining.WORKER_NONCES_WORK * (this._workersList.length - this.workers);
        if (this.mining._nonce < 0)
            this.mining._nonce = 0;

        this.decreaseWorkers();
    }

    createWorker() {

        let worker = this.mining._getWorker();
        console.log("worker created",worker);

        if (worker === undefined || worker === null)
            throw 'No Worker specified';

        this._workersList.push(worker);


        worker.addEventListener('message', (event) => {
            this.mining._puzzleReceived(worker, event);
        });

        return worker;
    }

    terminateWorker(worker){
        this.suspendWorker(worker);
        worker.terminate()
    }

    terminateWorkers(){

        for (let i = 0; i < this._workersList.length; i++)
            this.terminateWorker(this._workersList[i]);

        this._workersList = [];
    }

    suspendWorker(worker){
        worker.suspended = true;
        worker.postMessage({message: "terminate"});
    }

    suspendWorkers(){
        for (let i = 0; i < this._workersList.length; i++)
            this.suspendWorker(this._workersList[i]);
    }


}



export default InterfaceBlockchainMiningWorkersList;