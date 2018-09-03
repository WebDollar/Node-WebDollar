import Blockchain from "main-blockchain/Blockchain";
import Utils from "common/utils/helpers/Utils";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization';
import StatusEvents from "common/events/Status-Events";
import Log from 'common/utils/logging/Log';

class PoolWork {

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.lastBlockPromise = undefined;
        this.lastBlock = undefined;
        this.lastBlockNonce = 0;
        this.lastBlockId = 0;

        this._blocksList = []; //for garbage collector

    }

    startGarbageCollector(){
        this._garbageCollectorInterval = setInterval( this._garbageCollector.bind(this), 5000);
    }

    stopGarbageCollector(){

        if (this._garbageCollectorInterval !== undefined)
            clearInterval(this._garbageCollectorInterval);

    }

    findBlockById(blockId, blockHeight){

        for (let i=0; i<this._blocksList.length; i++)
            if ( (blockId !== undefined && this._blocksList[i].blockId === blockId ) || ( this._blocksList[i].block.height === blockHeight ) ){
                return this._blocksList[i].block;
            }

        return undefined;
    }

    getNextBlockForWork(){

        if (!Blockchain.synchronized)
            throw {message: "Blockchain is not yet synchronized"};

        //still pending
        if (this.lastBlockPromise !== undefined && this.lastBlockPromise.isPending() )
            return this.lastBlockPromise;

        //new work

        this.lastBlockPromise = Utils.makeQuerablePromise( new Promise( async (resolve)=>{

            this.lastBlock = await this.blockchain.mining.getNextBlock();
            this.lastBlockNonce = 0;


            if (this.lastBlock.computedBlockPrefix === null )
                this.lastBlock._computeBlockHeaderPrefix();

            this.lastBlockSerialization = Buffer.concat( [
                Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.lastBlock.height) ),
                Serialization.serializeBufferRemovingLeadingZeros( this.lastBlock.difficultyTargetPrev ),
                this.lastBlock.computedBlockPrefix
            ]);

            this.lastBlockId ++ ;

            this.lastBlockElement = {

                block: this.lastBlock,
                blockId: this.lastBlockId,

                instances: {

                },
            };

            this._blocksList.push( this.lastBlockElement );

            if  (!this.blockchain.semaphoreProcessing.processing && ( this.lastBlock.height !==  this.blockchain.blocks.length || !this.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash ))) {
                console.error("ERRRORR!!! HASHPREV DOESN'T MATCH blocks.last.hash");
                resolve(false);
                return;
            }

            resolve(true);
        }));

        return this.lastBlockPromise;


    }


    _garbageCollector(){

        let time = (new Date().getTime()/1000) - BlockchainGenesis.timeStampOffset;

        for (let i=0; i<this._blocksList.length; i++) {

            //verify if the block was a solution to a block
            let found = false;
            for (let j =0 ; j < this.poolManagement.poolData.blocksInfo.length; j++)
                if ( this.poolManagement.poolData.blocksInfo[j].block !== undefined && this._blocksList[i].block !== undefined &&
                     (this.poolManagement.poolData.blocksInfo[j].block === this._blocksList[i].block || ( this._blocksList[i].block.hash !== null && this.poolManagement.poolData.blocksInfo[j].block.hash.equals(this._blocksList[i].block.hash) )) ){
                    found = true;
                    break;
                }

            if (!found)
                //delete block
                if ( this._blocksList[i].block !== this.lastBlock && ( (time - this._blocksList[i].block.timeStamp ) > 20*consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK) && this._blocksList[i].block.height < this.blockchain.blocks.length - 20 ) {

                    Log.warn("==========================================", Log.LOG_TYPE.POOLS);
                    Log.warn("GARBAGE COLLECTOR DELETE BLOCK "+ this._blocksList[i].blockId +" height "+this._blocksList[i].block.height, Log.LOG_TYPE.POOLS);
                    Log.warn("==========================================", Log.LOG_TYPE.POOLS);

                    for (let key in this._blocksList[i].instances)
                        if (this._blocksList[i].instances.hasOwnProperty(key))
                            this._blocksList[i].instances[key].workBlock = undefined;


                    if (this._blocksList[i].block !== undefined)
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