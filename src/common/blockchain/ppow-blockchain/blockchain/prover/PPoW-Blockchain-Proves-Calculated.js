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

        //all blocks stores levels of each blocks
        // block 0: level
        // block 1: level
        // block 2: level
        this.allBlocks = {};

    }

    deleteBlockCalculated(block, level){

        if ( level === undefined && (block.difficultyTarget === undefined || block.difficultyTarget === null) )
            return;

        try {
            if (level === undefined)
                level = block.getLevel();
        } catch (exception){
            console.error("couldn't get level", exception);
            return;
        }

        let oldPos = this._binarySearch( level , block);
        if (oldPos !==-1 && this.levels[level][oldPos] === block) {

            this.levels[level].splice(oldPos, 1);
            this.levelsLengths[level]--;

            //deleting old ones if they have a different level
            if ( this.allBlocks[block.height] !== undefined )
                this.allBlocks[block.height] = undefined;

        }

    }


    updateBlock(block){

        if (block === undefined || block === null) return false;

        let level, pos;

        try {

            if (level === undefined && (block.difficultyTarget === undefined || block.difficultyTarget === null))
                return;

            level = block.getLevel();
            pos = this._binarySearch(this.levels[level], block);

            if (this.levels[level][pos] !== undefined && this.levels[level][pos].height === block.height) {
                this.levels[level][pos] = block;
                return;
            }

            this.deleteBlockCalculated(block, level);


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
    _binarySearch (array, value, findSpecificValue=true) {

        if (array === undefined) return -1;
        if (value === undefined) return -1;

        var guess,
            min = 0,
            max = array.length - 1;

        while(min <= max){
            guess = Math.floor((min + max) /2);
            if(array[guess].height === value.height){
                min = guess;
                break;
            }
            else if(array[guess].height < value.height)
                min = guess + 1;
            else
                max = guess - 1;
        }

        if (findSpecificValue && (array[min] === undefined || array[min].height !== value.height)) return -1;

        return min;
    }


    saveProvesCalculated(){

    }

    loadProvesCalculated(){

    }

}

export  default PPoWBlockchainProvesCalculated;