import global from "consts/global"
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain";
import Log from 'common/utils/logging/Log';

const SAVING_MANAGER_INTERVAL = 5000;

class SavingManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._pendingBlocksList = {};

        this._timeoutSaveManager = setTimeout( this._saveManager.bind(this), SAVING_MANAGER_INTERVAL );

        this._factor = Math.floor( Math.random()*10 );
    }


    addBlockToSave(block, height){

        if (process.env.BROWSER) return;

        if ( !block ) return false;

        if ( !height )
            height = block.height;

        if ( !this._pendingBlocksList[height] ) {

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



    }

    async _saveNextBlock(){

        if (process.env.BROWSER) return;

        for (let key in this._pendingBlocksList){

            let blocks = this._pendingBlocksList[key];

            if ( !blocks || blocks.length === 0 ){
                this._pendingBlocksList[key] = undefined;
                delete this._pendingBlocksList[key];
                continue;
            }

            let done = false;

            for (let i=0; i<blocks.length; i++){

                let block = blocks[i];

                //already deleted
                if (!block.block || !block.block.blockchain ){
                    blocks.splice(i,1);
                    i--;
                    continue;
                }

                try {

                    block.saving = true;

                    if (block.block.height % 5000 === 0)
                        await this.blockchain.db.restart();

                    await this.blockchain.saveNewBlock(block.block, false, true);

                } catch (exception){

                    Log.error("Saving raised an Error", Log.LOG_TYPE.SAVING_MANAGER, exception);

                }

                //saving Accountant Tree
                if (block.block.height === this.blockchain.blocks.length-1 && block.block.height % (100 + this._factor ) === 0)
                    await this.blockchain.saveAccountantTree(this.blockchain.accountantTree.serializeMiniAccountant(false, 5000), this.blockchain.blocks.length );


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

        try{
            await this._saveNextBlock();
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

}

export default SavingManager;