import global from "consts/global"
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain";
import Log from 'common/utils/logging/Log';

const SAVING_MANAGER_INTERVAL = 3000;

class SavingManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._pendingBlocksList = {};
        this._pendingAccountantTrees = {};

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

    }

    _addAccountantTreeToSave(block, height){

        if (height % 100 === 0) {

            Log.info('Accountant Tree Saved Pending', Log.LOG_TYPE.SAVING_MANAGER);
            this._pendingAccountantTrees[height] = this.blockchain.lightAccountantTreeSerializations[height + 1 - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES + 1];

        }

    }

    addBlockToSave(block, height){

        if (block === undefined || block === null) return false;

        if (height === undefined)
            height = block.height;

        if (this._pendingBlocksList[height] === undefined) {

            this._pendingBlocksList[height] = [{
                saving: false,
                block: block,
            }];

        } else {


            for (let i=0; i<this._pendingBlocksList[height].length; i++)
                if (!this._pendingBlocksList[height][i].saving){       //not saved
                    this._pendingBlocksList[height][i].saving = false;
                    this._pendingBlocksList[height][i].block = block;
                    return true;
                }

            this._pendingBlocksList[height].push({
                saving: false,
                block: block,
            });

        }



        this._addAccountantTreeToSave(block, height);

    }

    async _saveNextBlock(){

        for (let key in this._pendingBlocksList){

            let blocks = this._pendingBlocksList[key];

            if (blocks === undefined){
                this._pendingBlocksList[key] = undefined;
                delete this._pendingBlocksList[key];
                continue;
            }

            if (blocks.length === 0){
                this._pendingBlocksList[key] = undefined;
                delete this._pendingBlocksList[key];
                continue;
            }

            let done = false;

            for (let i=0; i<blocks.length; i++){

                let block = blocks[i];

                //already deleted
                if (block.block === undefined || block.block.blockchain === undefined){
                    blocks.splice(i,1);
                    i--;
                    continue;
                }

                try {

                    block.saving = true;

                    await this.blockchain.saveNewBlock(block.block);

                } catch (exception){

                    Log.error("Saving raised an Error", Log.LOG_TYPE.SAVING_MANAGER, exception);

                }

                //saving Accountant Tree
                if (this._pendingAccountantTrees[block.block.height] !== undefined) {
                    await this.blockchain.saveAccountantTree(this._pendingAccountantTrees[block.block.height], block.block.height + 1);
                    delete this._pendingAccountantTrees[block.block.height];
                }

                block.saving = false;


                done = true;
                blocks.splice(i, 1);
                break;

            }

            if (done)
                return key;

        }

        return null;
    }

    async _saveManager(){

        await this._saveNextBlock();

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

    }

    async saveAllBlocks(){

        if (this._isBeingSavedAll) return;

        this._isBeingSavedAll = true;

        clearTimeout( this._timeoutSaveManager );

        global.INTERFACE_BLOCKCHAIN_SAVED = false;

        let answer = 1;

        while (answer !== null){

            answer = await this._saveNextBlock();

            if (answer !== null && answer % 100 === 0) {

                Log.info("Saving successfully", Log.LOG_TYPE.SAVING_MANAGER, answer);
                await this.blockchain.sleep(10);
            }

        }

        global.INTERFACE_BLOCKCHAIN_SAVED = true;


    }

}

export default SavingManager;