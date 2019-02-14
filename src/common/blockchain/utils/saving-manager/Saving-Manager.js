import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'

import global from "consts/global"
import consts from 'consts/const_global'
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

        if (!this._pendingBlocks[height])
            this._pendingBlocksCount++;

        this._pendingBlocks[height] = block;

    }

    async _saveNextBlock(){

        if (process.env.BROWSER) return;

        let block;
        for (let key in this._pendingBlocks){

            block = this._pendingBlocks[key];

            //remove the block for saving
            this._pendingBlocks[key] = undefined;
            delete this._pendingBlocks[key];

            //mark a promise to the save to enable loading to wait until it is saved
            let resolver;
            this._pendingBlocks[ key ] = new Promise( resolve=> resolver = resolve );

            await this.blockchain.blocks.loadingManager.deleteBlock(block.height, block);

            try {

                await block.saveBlock();

                if (block.height % 5000 === 0)
                    await this.blockchain.db.restart();

            } catch (exception){

                Log.error("Saving raised an Error", Log.LOG_TYPE.SAVING_MANAGER, exception);

            }

            this._pendingBlocksCount--;

            //propagate block in case loadingManager was using this block
            await resolver(block);

            //no new object, just the promise
            if ( this._pendingBlocks[ key ] instanceof Promise)
                delete this._pendingBlocks[ key ] ;

            //saving Accountant Tree
            if (block.height === this.blockchain.blocks.length-1 && block.height % (500 + this._factor ) === 0)
                await this.saveBlockchain();

            block.saving = false;
            break;

        }

        return block;

    }

    async saveBlockchain(){
        return this.blockchain.saveMiniBlockchain();
    }

    async _saveManager(){

        let count = 1;


        try{

            if (this._pendingBlocksCount > MAX_BLOCKS_MEMORY )
                count = this._pendingBlocksCount - MAX_BLOCKS_MEMORY;

            for (let i=0; i < count; i++) {

                if (this._isBeingSavedAll) return;

                await this._saveNextBlock();

                if (i > 0 && i % 50 === 0)
                    await this.blockchain.sleep(1000);

            }
        } catch (exception){
            console.error("SavingManager _clearOldUnusedBlocks raised an error", exception);
        }

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

    }

    async saveAllBlocks(){

        if (this._isBeingSavedAll) return;
        this._isBeingSavedAll = true;

        global.INTERFACE_BLOCKCHAIN_SAVED = false;

        Log.info("Saving Manager - Saving All Blocks started", Log.LOG_TYPE.SAVING_MANAGER);

        let answer = 1;

        while (answer ){

            clearTimeout( this._timeoutSaveManager );

            answer = await this._saveNextBlock();

            if (answer && answer % 100 === 0) {

                Log.info("Saving successfully", Log.LOG_TYPE.SAVING_MANAGER, answer);
                await this.blockchain.sleep(10);
            }

        }

        await this.saveBlockchain();

        Log.info("Saving Manager - Saving All Blocks finished", Log.LOG_TYPE.SAVING_MANAGER);

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