import Blockchain from "main-blockchain/Blockchain";
import Utils from "common/utils/helpers/Utils";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import consts from 'consts/const_global'

class PoolWork {

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.lastBlockPromise = undefined;
        this.lastBlock = undefined;
        this.lastBlockNonce = 0;

        this._blocksList = []; //for gerbage collector

    }

    startGarbageCollector(){
        this._garbageCollectorInterval = setInterval( this._garbageCollector.bind(this), 5000);
    }

    stopGarbageCollector(){

        if (this._garbageCollectorInterval !== undefined)
            clearInterval(this._garbageCollectorInterval);

    }

    getNextBlockForWork(){

        //still pending
        if (this.lastBlockPromise !== undefined && this.lastBlockPromise.isPending() )
            return this.lastBlockPromise;

        //new work

        if (!Blockchain.synchronized)
            throw {message: "Blockchain is not yet synchronized"};

        this.lastBlockPromise = Utils.MakeQuerablePromise( new Promise( async (resolve)=>{

            if (this.lastBlockPromise !== undefined )
                console.log("promise: ", this.lastBlockPromise.isPending(), "    isFulfilled: ", this.lastBlockPromise.isFulfilled())

            this.lastBlock = await this.blockchain.mining.getNextBlock();
            this.lastBlockNonce = 0;

            if (this.lastBlock.computedBlockPrefix === null )
                this.lastBlock._computeBlockHeaderPrefix();

            this.lastBlockElement = {
                block: this.lastBlock,
                instances: {

                },
            };

            this._blocksList.push(this.lastBlockElement);

            if  (!this.blockchain.semaphoreProcessing.processing && ( this.lastBlock.height !==  this.blockchain.blocks.length || !this.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash )))
                console.error("ERRRORR!!! HASHPREV DOESN'T MATCH blocks.last.hash");

            resolve(true);
        }));

        return this.lastBlockPromise;


    }


    _garbageCollector(){

        let time = new Date().getTime() - BlockchainGenesis.timeStampOffset;

        for (let i=0; i<this._blocksList.length; i++) {

            //verify if the block was a solution to a block
            let found = false;
            for (let j =0 ; j <this.poolManagement.poolData.blocksInfo.length; j++)
                if (this.poolManagement.poolData.blocksInfo[j].block === this._blocksList[i].block){
                    found = true;
                    break;
                }

            if (!found)
                //delete block
                if (this._blocksList[i].block !== this.lastBlock && (time - this._blocksList[i].block.timeStamp > 5*consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK*1000)) {

                    for (let key in this._blocksList[i].instances)
                        if (this._blocksList[i].instances.hasOwnProperty(key))
                            this._blocksList[i].instances[key].workBlock = undefined;

                    this._blocksList[i].block.destroyBlock();
                    this._blocksList[i].block = undefined;
                    this._blocksList[i].instances = undefined;

                    this._blocksList.splice(i, 1);

                    i--;
                }

        }

    }

}

export default PoolWork;