import global from "consts/global"
import consts from 'consts/const_global'
import Log from 'common/utils/logging/Log';
import Utils from "common/utils/helpers/Utils";

const SAVING_MANAGER_INTERVAL = 5000;
const MAX_BLOCKS_MEMORY = 1000;

class SavingManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._pendingBlocks = {};
        this._pendingBlocksCount = 0;

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

        this._factor = Math.floor( Math.random()*20 );

    }


    addBlockToSave(block, height = block.height){

        if (process.env.BROWSER) return;

        if ( !block ) return false;

        if (!this._pendingBlocks[height])
            this._pendingBlocksCount++;

        this._pendingBlocks[height] = block;

    }

    async _saveNextBlock(){

        if (process.env.BROWSER) return;

        if (this.blockchain.semaphoreProcessing._list.length > 0) return;

        let block = await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

            for (let key in this._pendingBlocks){

                let block = this._pendingBlocks[key];
                if (block instanceof Promise) continue;

                //it is a forkBlock, it is skipped
                if (block.isForkBlock) continue;

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
                if (block.height === this.blockchain.blocks.length-1 && block.height % (250 + this._factor ) === 0)
                    await this.saveBlockchain(false);

                block.saving = false;
                return block;

            }

            return undefined;

        });

        return block;

    }

    async saveBlockchain( useSemaphore ){
        return this.blockchain.saveMiniBlockchain(true, useSemaphore );
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
        clearTimeout( this._timeoutSaveManager );

        global.INTERFACE_BLOCKCHAIN_SAVED = false;

        Log.info("Saving Manager - Saving All Blocks started", Log.LOG_TYPE.SAVING_MANAGER);

        let answer = 1;

        while ( this.blockchain.semaphoreProcessing._list.length > 0 ) {
            await Utils.sleep(2000);
            Log.info("Saving Manager - Waiting for Forks to be resolved...", Log.LOG_TYPE.SAVING_MANAGER);
        }

        await Utils.sleep(1000);

        Log.info("Saving Manager - No more forks", Log.LOG_TYPE.SAVING_MANAGER);

        while ( this._pendingBlocksCount > 0 ){

            answer = await this._saveNextBlock();

            if (answer && answer.height % 50 === 0) {

                Log.info("Saving successfully", Log.LOG_TYPE.SAVING_MANAGER, answer.height);
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