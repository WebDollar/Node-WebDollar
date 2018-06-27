import global from "consts/global"

const SAVING_MANAGER_INTERVAL = 3000;

class SavingManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._pendingBlocksList = {};

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

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

            return true;
        }


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
                if (block.block.blockchain === undefined){
                    blocks.splice(i,1);
                    i--;
                    continue;
                }

                try {

                    block.saving = true;

                    await this.blockchain.saveNewBlock(block.block);
                } catch (exception){
                    console.error("Saving raised an error: ", exception);
                }

                block.saving = false;


                done = true;
                blocks.splice(i, 1);
                break;

            }

            if (done)
                return true;

        }

        return false;
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

        let answer = true;
        while (answer){

            answer = await this._saveNextBlock();

        }

        global.INTERFACE_BLOCKCHAIN_SAVED = true;


    }

}

export default SavingManager;