const CLEAR_OLD_UNUSED_BLOCKS_INTERVAL = 30*1000;
const CLEAR_OLD_UNUSED_BLOCKS = 5*60*1000;
const MAX_BLOCKS_MEMORY = 1000;

class MemoryManager{

    constructor(blockchain, savingManager, maxData = MAX_BLOCKS_MEMORY){

        this.blockchain = blockchain;
        this.savingManager = savingManager;

        this._loaded = {};
        this._loadedCount = 0;

        this._maxData = maxData;

        this._intervalClearOldUnsuedBlocks = setTimeout( this._clearOldUnusedBlocks.bind(this), CLEAR_OLD_UNUSED_BLOCKS_INTERVAL );

    }

    _validateHeight(height){
        if (height >= this.blockchain.blocks.length)
            throw {message: "getData  invalid height", height: height};
    }

    async getData(height){

        this._validateHeight(height);

        if (!this._loaded[height]){

            let data = await this._loadData(height);
            this.addToLoaded(height, data);
            return this._loaded[height].data;

        }

        this._loaded[height].lastTimeUsed = new Date().getTime();
        return this._loaded[height].data;

    }

    async _loadData(height){

        return null;

    }

    _clearOldUnusedBlocks(){

        let date = new Date().getTime();

        try{

            for (let key in this._loaded)
                if ( date - this._loaded[key].lastTimeUsed > CLEAR_OLD_UNUSED_BLOCKS) {

                    //check if it is not 11being saved by the Save Manager
                    delete this._loaded[key];
                    this._loadedCount--;

                }

            if (this._loadedCount > this._maxData){

                let array = Object.values(this._loaded);
                array.sort(function(a, b) {
                    return a.lastTimeUsed - b.lastTimeUsed;
                });

                for (let i=this._maxData; i < array.length; i++)
                    delete this._loaded[ array[i].height ];

                this._loadedCount -= this._maxData;

            }

        } catch (exception){
            console.error("MemoryManager _clearOldUnusedBlocks raised an error", exception);
        }

        this._intervalClearOldUnsuedBlocks = setTimeout( this._clearOldUnusedBlocks.bind(this), CLEAR_OLD_UNUSED_BLOCKS_INTERVAL );

    }

    addToLoaded(height, data){

        this._loaded[height] = {
            lastTimeUsed : new Date().getTime(),
            data: data,
        };

    }

}

export default MemoryManager;