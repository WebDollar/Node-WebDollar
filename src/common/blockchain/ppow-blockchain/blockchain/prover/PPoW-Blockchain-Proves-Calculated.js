import Log from 'common/utils/logging/Log';

class PPoWBlockchainProvesCalculated{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.levelsLengths = [];
        this.levels = [];

        for (let i=-1; i<256; i++) {
            this.levelsLengths[i] = 0;
            this.levels[i] = [];
        }

        this.allBlocks = {};

    }

    deleteBlock(block, level){

        if (level === undefined && (block.difficultyTarget === undefined || block.difficultyTarget === null))
            return;

        try {
            if ( !level )
                level = block.level;
        } catch (exception){
            console.error("couldn't get level", exception);
            return;
        }



        //deleting old ones if they have a different level
        if (this.allBlocks[block.height] !== undefined && this.allBlocks[block.height] === block && this.allBlocks[block.height] !== level) {

            let oldlevel = this.allBlocks[block.height];
            this.levelsLengths[oldlevel]--;

            this.allBlocks[block.height] = undefined;

            let oldPos = this._binarySearch(this.levels[oldlevel], block);
            if (this.levels[oldlevel][oldPos] === block)
                this.levels[oldlevel].splice(oldPos, 1);
        }

    }

    updateBlock(block){

        if (block === undefined || block === null) return false;

        let level, pos;

        try {

            if (level === undefined && (block.difficultyTarget === undefined || block.difficultyTarget === null))
                return;

            level = block.level;
            pos = this._binarySearch(this.levels[level], block);


            this.deleteBlock(block);


            if (this.levels[level][pos] !== undefined && this.levels[level][pos].height === block.height) {
                this.levels[level][pos] = block;
                return;
            }

            this.levelsLengths[level]++;
            this.allBlocks[block.height] = level;

            if (this.levels[level].length === 0)
                this.levels[level] = [block];
            else {

                if (block.height > this.levels[level][this.levels[level].length - 1].height)
                    this.levels[level].push(block);
                else {

                    if (pos === 0)
                        this.levels[level].unshift(block);
                    else
                        this.levels[level].splice(pos, 0, block);
                }

            }

        } catch (exception){

            Log.error( "Error Proves Updating Block", Log.LOG_TYPE.BLOCKCHAIN, {level: level, pos:pos}, exception,  )

        }

    }



    /**
     * Return 0 <= i <= array.length such that !pred(array[i - 1]) && pred(array[i]).
     */
    _binarySearch (array, value) {

        if (array === undefined) return -1;

        var guess,
            min = 0,
            max = array.length - 1;

        while(min <= max){
            guess = Math.floor((min + max) /2);
            if(array[guess].height === value.height)
                return guess;
            else if(array[guess].height < value.height)
                min = guess + 1;
            else
                max = guess - 1;
        }

        return min;
    }


    saveProvesCalculated(){

    }

    loadProvesCalculated(){

    }

}

export  default PPoWBlockchainProvesCalculated;