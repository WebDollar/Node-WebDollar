import InterfaceBlockchainMining from "./Interface-Blockchain-Mining";

class InterfaceBlockchainMiningWorkers extends InterfaceBlockchainMining {

    constructor(blockchain, minerAddress){

        super(blockchain, minerAddress);

        this.workers = 0; // browser webWorkers, backbone cores
        this.workersList = [];

        this.WORKERS_MAX = 20;

        this.WORKER_NONCES_WORK = 100;
        this.workerResolve = undefined;
    }


    mine(block, difficulty){

        this.difficulty = difficulty;

        return new Promise((resolve)=>{

            // AntelleMain("wasm");

            this.workerResolve = resolve;

            for (let i=0; i<this.workersList.length; i++)
                this.initializeWorker(this.workersList[i], block);

            this.workersInterval = setInterval(()=>{

                if (this._nonce >= 0xFFFFFFFF) resolve({result:false}); //we didn't find anything

                if (this.workersList.length < this.workers){

                    let worker = this.createWorker();
                    this.initializeWorker(worker, block);
                }

                if (this.workersList.length > this.workers)
                    this.reduceWorkers();

            }, 10)



        });

    }

    puzzleReceived(worker, event){

        if (event.data.message === "error"){

        }
        else
        if (event.data.message === "results") {

            console.log("REEESULTS!!!",event.data);

            if (event.data.hash === undefined){
                console.log("Worker Error");
            } else{

                for (let i = 0, l=event.data.hash.length; i < l; i++)

                    if (event.data.hash[i] <= this.difficulty[i] ) {

                        this.suspendWorkers();

                        this._nonce = event.data.nonce;

                        clearTimeout(this.workersInterval);

                        if (this.workerResolve !== undefined)
                            this.workerResolve({
                                result: true,
                                hash: new Buffer(event.data.hash),
                                nonce: event.data.nonce,
                            });

                        return;

                    } else break;
            }

            worker.postMessage({message: "new-nonces", nonce: this._nonce, count: this.WORKER_NONCES_WORK});
            this._nonce += this.WORKER_NONCES_WORK;

        } else
        if (event.data.message === "log") {
            console.log("worker", event.data.log);
        }

    }




    getWorker(){
        return null;
    }

    createWorker() {

        console.log("creating 1 worker");

        let worker = this.getWorker();
        if (worker === undefined || worker === null) throw 'No Worker specified';

        this.workersList.push(worker);

        console.log("worker", worker);

        worker.addEventListener('message', (event) => {
            this.puzzleReceived(worker, event);
        });

        return worker;
    }

    terminateWorkers(){
        for (let i=0; i<this.workersList.length; i++)
            this.workersList[i].postMessage({message: "terminate"});

        this.workersList = [];
    }

    suspendWorkers(){
        for (let i=0; i<this.workersList.length; i++)
            this.workersList[i].postMessage({message: "terminate"});
    }

    reduceWorkers(){

        //be sure we didn't skip anything

        console.log("reduce workers");

        this._nonce -= this.WORKER_NONCES_WORK * (this.workersList.length - this.workers);
        if (this._nonce < 0) this._nonce = 0;

        for (let i=this.workersList.length-1; i>this.workers-1; i++)
            this.workersList[i].postMessage({message: "terminate"});

        this.workersList.splice(this.workers-1);
    }

    initializeWorker(worker, block){
        worker.postMessage({message: "initialize", block: block.computedBlockPrefix, nonce: this._nonce , count: this.WORKER_NONCES_WORK });
        this._nonce += this.WORKER_NONCES_WORK;
    }


    async increaseWorkers(number){
        this.workers += number;
        if (this.workers > this.WORKERS_MAX) this.workers = this.WORKERS_MAX;

        if (!this.started && this.workers > 0) await this.startMining();
    }

    async decreaseWorkers(number){
        this.workers -= number;
        if (this.workers < 0) {
            this.workers = 0;
            this.stopMining();
        }
    }

    async startMining(){

        if (this.workers === 0)
            this.workers = 1;

        InterfaceBlockchainMining.prototype.startMining.call(this);

    }

    async stopMining(){

        this.workers = 0;

        InterfaceBlockchainMining.prototype.stopMining(this);

    }

}