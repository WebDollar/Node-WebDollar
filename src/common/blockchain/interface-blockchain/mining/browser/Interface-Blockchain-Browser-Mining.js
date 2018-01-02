import InterfaceBlockchainMining from "../Interface-Blockchain-Mining";

const webWorkify = require ('webworkify');

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMining{

    constructor (blockchain, minerAddress){

        super(blockchain, minerAddress);
    }

    createWorker(method) {

        let worker = webWorkify(require('./Browser-Mining-WebWorker'));
        worker.method = method;

        return worker;
    }

    terminateWorkers(){
        for (let i=0; i<this.workersList.length; i++)
            this.workersList[i].postMessage({message: "terminate"});

        this.workersList = [];
    }


    mine(block, difficulty){

        this.difficulty = difficulty;

        return new Promise((resolve)=>{

            let workersInterval = setInterval(()=>{

                if (this.workersList.length < this.workers){

                    let worker = this.createWorker();

                    worker.onmessage = (event)=>{

                        this.hashesPerSecondFuture += event.data.count;

                        //console.log(this.hashesGeneratedBest, event.data.hashesGeneratedBest,this.hashesGeneratedBest > event.data.hashesGeneratedBest);

                        if ( event.data.hash.compare(this.difficulty) <= 0 ) {

                            this.terminateWorkers();
                            this._nonce = event.data.nonce;

                            resolve({
                                result:true,
                                hash: event.data.hash,
                                nonce: event.data.nonce,
                            });

                        }

                    };

                    this.workersList.push(worker);
                }

                if (this.workersList.length > this.workers){

                    for (let i=this.workersList.length-1; i>this.workers-1; i++)
                        workersInterval.postMessage({message: "terminate"});

                    this.workersList.splice(this.workers-1);

                }

            }, 10)

        });

    }

}

export default InterfaceBlockchainBrowserMining