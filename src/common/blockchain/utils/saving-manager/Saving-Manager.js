import global from "consts/global"
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain";
import Log from 'common/utils/logging/Log';

const SAVING_MANAGER_INTERVAL = 5000;
const MAX_BLOCKS_MEMORY = 1000;

class SavingManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._pendingBlocks = {};
        this._pendingBlocksCount = 0;

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

        this._factor = Math.floor( Math.random()*10 );

    }


    addBlockToSave(block, height){

        if (process.env.BROWSER) return;

        if ( !block ) return false;

        if ( !height )
            height = block.height;

        if (!this._pendingBlocks)
            this._pendingBlocksCount++;

        this._pendingBlocks[height] = block;

    }

    async _saveNextBlock(){

        if (process.env.BROWSER) return;

        let block;
        for (let key in this._pendingBlocks){

            block = this._pendingBlocks[key];
            this._pendingBlocks[key] = undefined;
            delete this._pendingBlocks[key];

            this._pendingBlocksCount--;

            try {

                if (block.height % 5000 === 0)
                    await this.blockchain.db.restart();

                await block.saveBlock();

            } catch (exception){

                Log.error("Saving raised an Error", Log.LOG_TYPE.SAVING_MANAGER, exception);

            }

            //saving Accountant Tree
            if (block.height === this.blockchain.blocks.length-1 && block.height % (100 + this._factor ) === 0)
                await this.saveBlockchain();

            block.saving = false;

        }

        return block;

    }

    async saveBlockchain(){
        return this.blockchain.saveMiniBlockchain();
    }

    async _saveManager(){

        let count = 1;

        if (this._pendingBlocksCount > MAX_BLOCKS_MEMORY )
            count = this._pendingBlocksCount - MAX_BLOCKS_MEMORY;

        try{
            for (let i=0; i < count; i++) {

                await this._saveNextBlock();

                if (i > 0 && i % 50 === 0)
                    await this.blockchain.sleep(1000);

            }
        } catch (exception){

        }

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

    }

    async saveAllBlocks(){

        if (this._isBeingSavedAll) return;

        this._isBeingSavedAll = true;

        global.INTERFACE_BLOCKCHAIN_SAVED = false;

        let answer = 1;

        while (answer ){

            clearTimeout( this._timeoutSaveManager );

            answer = await this._saveNextBlock();

            if (answer && answer % 100 === 0) {

                Log.info("Saving successfully", Log.LOG_TYPE.SAVING_MANAGER, answer);
                await this.blockchain.sleep(10);
            }

        }

        global.INTERFACE_BLOCKCHAIN_SAVED = true;


    }


    async saveBlockchainLength(length ){

        let answer = await this.blockchain.db.save( this.blockchain._blockchainFileName, length, 20000, 1000000) ;

        if (!answer) {
            Log.error("Error saving the blocks.length", Log.LOG_TYPE.SAVING_MANAGER);
            return false;
        }

        return true;

    }

}

export default SavingManager;