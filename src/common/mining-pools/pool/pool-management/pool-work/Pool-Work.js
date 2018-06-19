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

            console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
            console.log(33333);
            let time = new Date().getTime();


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

            console.log(44444);
            console.log( (new Date().getTime() - time ) /1000, "s") ;
            console.log("**************************************************")

            resolve(true);
        }));

        return this.lastBlockPromise;


    }


    _garbageCollector(){

        let time = new Date().getTime() - BlockchainGenesis.timeStampOffset;

        for (let i=0; i<this._blocksList.length; i++) {

            //delete block
            if (this._blocksList[i].block !== this.lastBlock && time - this._blocksList[i].block.timeStamp > 5*consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK*1000) {

                for (let key in this._blocksList.instances)
                    this._blocksList.instances[key].workBlock = undefined;

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