import InterfaceBlockchainMining from "../Interface-Blockchain-Mining";

const webWorkify = require ('webworkify');

/**
 * WEBWORKIFY DOCUMENTATION ON https://github.com/browserify/webworkify
 */

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMining{

    constructor (blockchain, minerAddress){

        super(blockchain, minerAddress);

        this.WORKER_NONCES_WORK = 100;
    }

    createWorker(method) {

        let worker = webWorkify(require('./Browser-Mining-WebWorker'));

        return worker;
    }

    terminateWorkers(){
        for (let i=0; i<this.workersList.length; i++)
            this.workersList[i].postMessage({message: "terminate"});

        this.workersList = [];
    }

    reduceWorkers(){

        //be sure we didn't skip anything

        this._nonce -= this.WORKER_NONCES_WORK * (this.workersList.length - this.workers);
        if (this._nonce < 0) this._nonce = 0;

        for (let i=this.workersList.length-1; i>this.workers-1; i++)
            this.workersList[i].postMessage({message: "terminate"});

        this.workersList.splice(this.workers-1);
    }


    mine(block, difficulty){

        this.difficulty = difficulty;

        return new Promise((resolve)=>{

            let workersInterval = setInterval(()=>{

                if (this._nonce >= 0xFFFFFFFF) resolve({result:false}); //we didn't find anything

                if (this.workersList.length < this.workers){

                    let worker = this.createWorker();

                    worker.addEventListener('message', (event) => {

                        // this.hashesPerSecondFuture += event.data.count;
                        //console.log(this.hashesGeneratedBest, event.data.hashesGeneratedBest,this.hashesGeneratedBest > event.data.hashesGeneratedBest);

                        if (event.data.message === "error"){

                        }
                        else
                        if (event.data.message === "results") {

                            if (event.data.hash !== undefined && event.data.hash.compare(this.difficulty) <= 0) {

                                this.terminateWorkers();

                                this._nonce = event.data.nonce;

                                resolve({
                                    result: true,
                                    hash: event.data.hash,
                                    nonce: event.data.nonce,
                                });

                            } else {
                                worker.postMessage({message: "new-nonces", nonce: this._nonce, count: this.WORKER_NONCES_WORK})
                                this._nonce += this.WORKER_NONCES_WORK;
                            }
                        }

                    });
                    worker.postMessage({message: "initialize", block: block, nonce: this._nonce , count: this.WORKER_NONCES_WORK });
                    this._nonce += this.WORKER_NONCES_WORK;

                    this.workersList.push(worker);
                }

                if (this.workersList.length > this.workers)
                    this.reduceWorkers();

            }, 10)

        });

    }

}

export default InterfaceBlockchainBrowserMining