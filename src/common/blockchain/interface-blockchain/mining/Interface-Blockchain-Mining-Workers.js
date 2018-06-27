import InterfaceBlockchainMining from "./Interface-Blockchain-Mining";
import InterfaceBlockchainMiningWorkersList from "./Interface-Blockchain-Mining-Workers-List";

import Serialization from 'common/utils/Serialization';
import SemaphoreProcessing from "common/utils/Semaphore-Processing";
import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'

class InterfaceBlockchainMiningWorkers extends InterfaceBlockchainMining {


    constructor(blockchain, minerAddress, miningFeeThreshold){

        super(blockchain, minerAddress, miningFeeThreshold);

        this._workerFinished = false;

        this._workerResolve = undefined;

        this.block = null;

        this.WORKER_NONCES_WORK = 42;

        this.workers = new InterfaceBlockchainMiningWorkersList(this);

        this.bestHash =   consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER ;
        this.bestHashNonce = -1;

    }


    mine(block, difficultyTarget, start, end){

        //serialize the block
        if ( !Buffer.isBuffer( block ) && typeof block === 'object' && block.computedBlockPrefix !== undefined) {
            block = Buffer.concat( [
                Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(block.height) ),
                Serialization.serializeBufferRemovingLeadingZeros( block.difficultyTargetPrev ),
                block.computedBlockPrefix
            ]);
        }

        this.bestHash =  consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER ;
        this.bestHashNonce = -1;

        this.block = block;
        this.difficulty = difficultyTarget;

        this.start = start;
        this.end = end;

        this._nonce = start;


        this._workerFinished = false;

        let promiseResolve = new Promise ((resolve)=>{ this._workerResolve = resolve });

        //initialize new workers

        this.workers.initializeWorkers(block, difficultyTarget );

        return promiseResolve;
    }


    _getWorker(){
        return {};
    }


    _suspendMiningWorking(){

        this._workerFinished = true;

    }

    async setWorkers(newWorkers){

        if (newWorkers > this.workers.workers)
            await this.increaseWorkers( newWorkers - this.workers.workers );
        else
        if (newWorkers < this.workers.workers)
            await this.decreaseWorkers( - (newWorkers - this.workers.workers)  );

    }

    async increaseWorkers(number){

        if (number === 0)
            return;

        console.log("number", number);

        this.workers.addWorkers(number);

        if (!this.started && this.workers.workers > 0)
            await this.startMining();

        this.workers.createWorkers();


    }

    async decreaseWorkers(number){

        if (number === 0)
            return;

        console.log( "number", number );

        this.workers.addWorkers( - number );

        this.workers.reduceWorkers();

        if (this.workers.workers === 0)
            await this.stopMining();
    }

    async startMining(){

        InterfaceBlockchainMining.prototype.startMining.call(this);

        if (this.workers.workers === 0)
            await this.setWorkers(1);
    }

    async stopMining(){

        InterfaceBlockchainMining.prototype.stopMining.call(this);

        if (this.workers.workers !== 0)
            await this.setWorkers(0);

        this.checkFinished();

    }

    checkFinished(){

        if (this._nonce > this.end || (this.started === false) || (this.reset && this.useResetConsensus)){

            this.workers.suspendWorkers();
            this._suspendMiningWorking();

            if (this._workerResolve !== null && this._workerResolve !== undefined)
                this._workerResolve( { //we didn't find anything
                    result: false,
                    hash: this.bestHash,
                    nonce: this.bestHashNonce
                });

            return true;

        }

        if (this.reset && this.useResetConsensus) {
            console.warn("WORKERS MINING RESTARTED", this.reset);
            this._hashesPerSecond = 0;
        }

        return false;

    }

    _puzzleReceived(worker, event){

        if (this._workerFinished) //job finished
            return;

        if (this.checkFinished())
            return false;

        if (event.data.message === "worker nonce worked"){

            this._hashesPerSecond += event.data.nonceWork;

        } else
        if (event.data.message === "results") {

            worker.dateLast = new Date();

            if ( worker.suspended )
                return; //I am no longer interested

            if (event.data.hash === undefined){
                console.log("Worker Error");
            } else{

                let compare = 0;

                for (let i = 0, l = event.data.hash.length; i < l; i++)
                    if (event.data.hash[i] < this.bestHash[i]) {
                        compare = -1;
                        break;
                    }
                    else if (event.data.hash[i] > this.bestHash[i]) {
                        compare = 1;
                        break;
                    }

                if (compare === -1){

                    //verify block with the worker block
                    let match = true;

                    for (let i = 0, l=this.block.length;  i < l;  i++)
                        if (this.block[i] !== event.data.block[i] ) // do not match
                            match = false;

                    //verify the  bestHash with  the current target
                    if (match) {


                        this.bestHash = new Buffer(event.data.hash);
                        this.bestHashNonce = event.data.nonce;

                        if (this.bestHash.compare(this.difficulty) <= 0) {

                            console.log('processing done');

                            this._suspendMiningWorking();
                            this.workers.suspendWorkers();

                            this._workerResolve({
                                result: true,
                                hash: new Buffer(event.data.hash),
                                nonce: event.data.nonce,
                            });

                            return;

                        }

                    }


                }
            }

            if ( worker.suspended )
                return; //I am no longer interested

            worker.postMessage({message: "new-nonces", nonce: this._nonce, count: this.WORKER_NONCES_WORK});

            this._nonce += this.WORKER_NONCES_WORK;

        } else
        if (event.data.message === "algorithm"){

            console.log("algorithm information", event.data.answer);

            if (event.data.answer === "WebAssembly supported" || event.data.answer === "ASM.JS supported" ){

                if (event.data.answer === "ASM.JS supported")
                    StatusEvents.emit("validation/status", {type: "MINING", message: "WebAssembly not supported"});

                this.workers._initializeWorker( worker );

            } else { // Argon2 is not supported in Browser

                StatusEvents.emit("validation/status", {type: "MINING", message: "ASM.JS not supported"});

                this.stopMining();
            }

        } else
        if (event.data.message === "error"){

        }
        if (event.data.message === "log") {

            if (consts.DEBUG)
                console.log("worker", event.data.log);

        }

    }

}

export default InterfaceBlockchainMiningWorkers;