class PPoWBlockchainProvesCalculated{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.levelsLengths = [];
        this.levels = [];

        for (let i=0; i<=32; i++) {
            this.levelsLengths[i] = 0;
            this.levels[i] = [];
        }

        this.allBlocks = {};

    }

    updateBlock(block){


        let level = block.getLevel();
        let pos = this._binarySearch(this.levels[level], block);


        //deleting old ones if they have a different level
        if (this.allBlocks[block.height] !== undefined && this.allBlocks[block.height] !== level){

            let oldlevel = this.allBlocks[block.height];
            this.levelsLengths[oldlevel] -- ;

            this.allBlocks[block.height] = undefined;
            delete this.allBlocks[block.height];
            this.levels[oldlevel].splice(pos,1);
        }



        if (this.levels[level][pos] !== undefined && this.levels[level][pos].height === block.height  ){
            this.levels[level] = block;
            return;
        }

        this.levelsLengths[level]++;
        this.allBlocks[block.height] = level;

        if (this.levels[level].length === 0)
            this.levels[level] = [block];
        else {

            if (block.height > this.levels[level][this.levels[level].length-1].height)
                this.levels[level].push(block);
            else {

                if (pos === 0)
                    this.levels[level].unshift(block);
                else
                    this.levels[level].splice(pos, 0, block);
            }

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
            else if(array[guess] < value)
                min = guess + 1;
            else
                max = guess - 1;
        }

        return min;
    }
}

export  default PPoWBlockchainProvesCalculated;