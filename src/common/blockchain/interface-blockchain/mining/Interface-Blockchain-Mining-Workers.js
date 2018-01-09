import InterfaceBlockchainMining from "./Interface-Blockchain-Mining";

class InterfaceBlockchainMiningWorkers extends InterfaceBlockchainMining {

    constructor(blockchain, minerAddress){

        super(blockchain, minerAddress);

        this.workers = 0; // browser webWorkers, backbone cores
        this._workersList = [];
        this._workerFinished = false;

        this.WORKERS_MAX = 20;
        this.WORKER_NONCES_WORK = 100;

        this._workerResolve = undefined;
        this._workersSempahore = false;

        this.block = null;
    }


    mine(block, difficulty){

        if (typeof block === 'object' && block.computedBlockPrefix !== undefined)
            block = block.computedBlockPrefix;

        this.block = block;

        this.difficulty = difficulty;

        this._workerFinished = false;

        let promiseResolve = new Promise ((resolve)=>{ this._workerResolve = resolve });

        //initialize new workers
        for (let i=0; i<this._workersList.length; i++)
            this._initializeWorker(this._workersList[i], block);

        this.workersInterval = setInterval(()=>{

            if (this._workerFinished) return; //job finished

            if (this._nonce > 0xFFFFFFFF || (this.started === false) || this.reset){

                this._processWorkersSempahoreCallback(()=>{

                    this._suspendWorkers();
                    this._suspendMiningWorking();

                    this._workerResolve({result:false}); //we didn't find anything

                });

            }

        }, 10);


        return promiseResolve;

    }

    _puzzleReceived(worker, event){

        if (event.data.message === "error"){

        }
        else
        if (event.data.message === "results") {

            console.log("REEESULTS!!!", event.data, worker.suspended);

            if ( worker.suspended )
                return; //I am no longer interested

            if (event.data.hash === undefined){
                console.log("Worker Error");
            } else{

                //verify block with the worker block
                let match = true;

                for (let i=0; i<this.block.length; i++)
                    if (this.block[i] !== event.data.block[i] ) // do not match
                        match = false;

                //verify the  bestHash with  the current target
                if (match)
                    for (let i = 0, l=event.data.hash.length; i < l; i++)

                        if (event.data.hash[i] < this.difficulty[i] ) {

                            this._processWorkersSempahoreCallback( ()=>{

                                console.log('processing');

                                this._suspendMiningWorking();
                                this._suspendWorkers();

                                this._workerResolve({
                                    result: true,
                                    hash: new Buffer(event.data.hash),
                                    nonce: event.data.nonce,
                                });

                            });

                            return;

                        } else if (event.data.hash[i] > this.difficulty[i] ) break;
            }

            if ( worker.suspended )
                return; //I am no longer interested

            worker.postMessage({message: "new-nonces", nonce: this._nonce, count: this.WORKER_NONCES_WORK});
            this._nonce += this.WORKER_NONCES_WORK;
            this._hashesPerSecond += this.WORKER_NONCES_WORK;

        } else
        if (event.data.message === "log") {
            console.log("worker", event.data.log);
        }

    }




    _getWorker(){
        return null;
    }

    createWorker() {

        console.log("creating 1 worker");

        let worker = this._getWorker();
        if (worker === undefined || worker === null) throw 'No Worker specified';

        this._workersList.push(worker);


        worker.addEventListener('message', (event) => {
            this._puzzleReceived(worker, event);
        });

        return worker;
    }

    _terminateWorkers(){

        this._suspendWorkers();

        this._workersList = [];
    }

    _suspendWorkers(){
        for (let i=0; i<this._workersList.length; i++) {
            this._workersList[i].suspended = true;
            this._workersList[i].postMessage({message: "terminate"});
        }
    }

    _suspendMiningWorking(){

        clearTimeout(this.workersInterval);
        this._workerFinished = true;

    }

    _reduceWorkers(){

        //be sure we didn't skip anything

        console.log("reduce workers");

        this._nonce -= this.WORKER_NONCES_WORK * (this._workersList.length - this.workers);
        if (this._nonce < 0) this._nonce = 0;

        if (this.workers < 0) this.workers = 0; //can not be < 0 workers

        for (let i=this._workersList.length-1; i>this.workers-1; i--)
            this._workersList[i].postMessage({message: "terminate"});

        this._workersList.splice(this.workers-1);
    }

    _initializeWorker(worker, block){
        worker.suspended = false;
        worker.postMessage({message: "initialize", block: block, nonce: this._nonce , count: this.WORKER_NONCES_WORK });
        this._nonce += this.WORKER_NONCES_WORK;
        this._hashesPerSecond += this.WORKER_NONCES_WORK;
    }


    async increaseWorkers(number){
        this.workers += number;
        if (this.workers > this.WORKERS_MAX) this.workers = this.WORKERS_MAX;

        this.emitter.emit('mining/workers-changed', this.workers);

        // create new workers
        while (this._workersList.length < this.workers) {
            let worker = this.createWorker();
            this._initializeWorker(worker, this.block);
        }

        if (!this.started && this.workers > 0) await this.startMining();
    }

    async decreaseWorkers(number){

        this.workers -= number;
        if (this.workers <= 0) this.workers = 0;

        this.emitter.emit('mining/workers-changed', this.workers);

        //reduce the number of workers
        if (this._workersList.length > this.workers)
            this._reduceWorkers();

        if (this.workers === 0)
            await this.stopMining();
    }

    async startMining(){

        if (this.workers === 0) {
            this.workers = 1;
            this.emitter.emit('mining/workers-changed', this.workers);
        }

        InterfaceBlockchainMining.prototype.startMining.call(this);

    }

    async stopMining(){

        if (this.workers !== 0) {
            this.workers = 0;
            this.emitter.emit('mining/workers-changed', this.workers);
        }


        InterfaceBlockchainMining.prototype.stopMining.call(this);

    }

    _processWorkersSempahoreCallback(callback){

        return new Promise ((resolve) =>{

            let timer = setInterval( async () => {

                if ( this._workersSempahore === false ){

                    this._workersSempahore = true;
                    clearInterval(timer);

                    try {
                        // solved by somebody else
                        if (this._workerResolve === undefined || this._workerFinished){
                            this._workersSempahore = false;
                            resolve(false);
                            return;
                        }

                        let result = await callback();
                        this._workersSempahore = false;

                        resolve(result);
                        return;
                    } catch (exception){
                        this._workersSempahore = false;
                        console.log("_processWorkersSempahoreCallback Error", exception);
                        resolve(false);
                        throw exception;
                    }
                }
            },10);
        });

    }

}

export default InterfaceBlockchainMiningWorkers;