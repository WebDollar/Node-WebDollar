import InterfaceBlockchainMining from "../Interface-Blockchain-Mining";
import AntelleMain from "./antelle/main";

const webWorkify = require ('webworkify');

/**3
 * WEBWORKIFY DOCUMENTATION ON https://github.com/browserify/webworkify
 */

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMining{

    constructor (blockchain, minerAddress){

        super(blockchain, minerAddress);

        this.WORKER_NONCES_WORK = 100;
        this.workerResolve = undefined;
    }

    createWorker(method) {

        console.log("creating 1 worker");

        let worker = webWorkify(require('./Browser-Mining-WebWorker.js'));
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
        worker.postMessage({message: "initialize", block: block.computedBlockPrefix.toString("base64"), nonce: this._nonce , count: this.WORKER_NONCES_WORK });
        this._nonce += this.WORKER_NONCES_WORK;
    }

    mine(block, difficulty){

        this.difficulty = difficulty;

        return new Promise((resolve)=>{

            // AntelleMain("wasm");

            this.workerResolve = resolve;

            for (let i=0; i<this.workersList.length; i++)
                this.initializeWorker(this.workersList[i], block);

            let workersInterval = setInterval(()=>{

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

        // this.hashesPerSecondFuture += event.data.count;
        //console.log(this.hashesGeneratedBest, event.data.hashesGeneratedBest,this.hashesGeneratedBest > event.data.hashesGeneratedBest);

        if (event.data.message === "error"){

        }
        else
        if (event.data.message === "results") {

            console.log("REEESULTS!!!",event.data);

            if (event.data.hash === undefined){
                console.log("Worker Error");
            } else{
                for (let i = 0, l=event.data.hash.length; i < l; i++)
                    if (this.difficulty[i] > event.data.hash[i]) {

                        this.suspendWorkers();

                        this._nonce = event.data.nonce;

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

}

export default InterfaceBlockchainBrowserMining