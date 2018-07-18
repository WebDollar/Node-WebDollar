import Log from 'common/utils/logging/Log';
import consts from 'consts/const_global';
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";

class PPoWBlockchainProvesCalculated{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.levelsLengths = [];
        this.levels = [];

        for (let i=-1; i<=32; i++) {
            this.levelsLengths[i] = 0;
            this.levels[i] = [];
        }

        this.allBlocks = {};

        this.db = this.blockchain.db;

    }

    deleteBlock(block, level){

        if (level === undefined && (block.difficultyTarget === undefined || block.difficultyTarget === null))
            return;

        try {

            if (level === undefined) level = block.getLevel();

        }catch (exception){

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

            level = block.getLevel();
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

    async _SerializationProves(){

        let array = [];

        array.push( Serialization.serializeNumber4Bytes(this.levels.length) );
        for (let i=-1; i < this.levels.length; i++ ){

            array.push( Serialization.serializeNumber7Bytes(this.levels[i].length) );
            for (let j=0; j< this.levels[i].length; j++){

                array.push( Serialization.serializeBufferCountingLeadingZeros(this.levels[j].hash) ); //1 bytes
                array.push( Serialization.serializeBufferRemovingLeadingZeros(this.levels[j].hash) ); //32-zero count bytes

            }

        }

        return Buffer.concat(array);

    }

    async _DeserializationProves(Buffer, offset = 0) {

        if ( Object.keys(Buffer).length !== 0 ){

            let levelsLength = Serialization.deserializeNumber4Bytes(Buffer, offset);
            offset += 4;

            console.log(levelsLength);

            if( levelsLength !== 0 ) {

                for (let i = -1; i < levelsLength; i++) {

                    if (this.levels[i].length !== 0) {

                        this.levels[i].length = Serialization.deserializeNumber7Bytes(Buffer, offset);
                        offset += 7;

                        for (let j = 0; j < this.levels[i].length; j++) {

                            let zeroCount = this.levels[j].hash = BufferExtended.substr(Buffer, offset, 1);
                            offset += 1;

                            let hashPrefix = [];

                            for (let z = 0; z < zeroCount; z++) hashPrefix.push(0);

                            this.levels[j].hash = Buffer.concat([
                                hashPrefix,
                                this.levels[j].hash = BufferExtended.substr(Buffer, offset, 32 - zeroCount)
                            ]);

                            offset += 32 - zeroCount;

                        }

                    }

                }

            }

        }

    }

    async _saveProvesCalculated(key){

        if (key === undefined)
            key = this.blockchain._blockchainFileName+"_proves_calculated";

        let buffer = this._SerializationProves();

        console.log("Save proof creator "+key);
        console.log(buffer);

        return (await this.db.save( key, buffer ));

    }

    async _loadProvesCalculated(key){

        if (key === undefined)
            key = this.blockchain._blockchainFileName+"_proves_calculated";

        console.log("Load proof creator "+key);

        try{

            let buffer = await this.db.get(key, 12000);

            if (buffer === null && !Buffer.isBuffer(buffer)) {
                console.error("Proof for key "+key+" was not found");
                return false;
            }

            console.log("bufffffr ",buffer);

            await this._DeserializationProves(buffer);

            return true;

        }
        catch(exception) {
            console.error( 'ERROR on LOAD block: ', exception);
            return false;
        }

    }

}

export  default PPoWBlockchainProvesCalculated;