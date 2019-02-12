import Log from 'common/utils/logging/Log';
import consts from 'consts/const_global';
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";

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

        this.db = this.blockchain.db;

    }

    deleteBlock(height, level){

        if (typeof height === "object") {
            level = height.level;
            height = height.height;
        }


        if ( level  === undefined){
            console.error("couldn't get level");
            return false;
        }

        //deleting old ones if they have a different level
        if (this.allBlocks[height] && this.allBlocks[height] !== level) {

            let oldlevel = this.allBlocks[height];
            this.levelsLengths[oldlevel]--;

            delete this.allBlocks[height];

            let oldPos = this._binarySearch( this.levels[oldlevel], height);
            if (this.levels[oldlevel][oldPos] === height)
                this.levels[oldlevel].splice(oldPos, 1);

        }

    }

    updateBlock(height, level){

        if (typeof height === "object") {
            level = height.level;
            height = height.height;
        }


        if ( level  === undefined){
            console.error("couldn't get level");
            return false;
        }

        let pos;

        try {

            pos = this._binarySearch( this.levels[level], height );

            this.deleteBlock(height, level);

            if (this.levels[level][pos] && this.levels[level][pos] === height)
                return true;

            this.levelsLengths[level]++;
            this.allBlocks[height] = level;

            if (this.levels[level].length === 0)
                this.levels[level] = [height];
            else {

                if (height > this.levels[level][this.levels[level].length - 1])
                    this.levels[level].push(height);
                else {

                    if (pos === 0)
                        this.levels[level].unshift(height);
                    else
                        this.levels[level].splice(pos, 0, height);
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

        if ( !array ) return -1;

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

        array.push( Serialization.serializeNumber2Bytes(this.levels.length) );
        for (let i=-1; i < this.levels.length; i++ ){

            array.push( Serialization.serializeNumber3Bytes(this.levels[i].length) );
            for (let j=0; j< this.levels[i].length; j++){

                //array.push( Serialization.serializeHashOptimized(this.levels[i][j].hash) ); //max 32 bytes
                array.push( Serialization.serializeNumber4Bytes( this.levels[i][j] ) );

            }

        }

        return Buffer.concat(array);

    }

    async _DeserializationProves(Buffer, offset = 0) {

        if ( Object.keys(Buffer).length !== 0 ){

            let levelsLength = Serialization.deserializeNumber2Bytes(Buffer, offset);
            offset += 2;

            console.log(levelsLength);

            if( levelsLength !== 0 ) {

                for (let i = -1; i < levelsLength; i++) {

                    let currentLevelLength = Serialization.deserializeNumber3Bytes(Buffer, offset);
                    offset += 3;

                    if (currentLevelLength !== 0) {

                        for (let j = 0; j < currentLevelLength; j++) {

                            this.levels[i][j] = {};
                            // let deserializeResult = Serialization.deserializeHashOptimized(Buffer,offset);
                            // this.levels[i][j].hash = deserializeResult.hash;
                            // offset = deserializeResult.offset;

                            this.levels[i][j] = Serialization.deserializeNumber4Bytes(Buffer,offset);
                            offset += 4;

                        }

                    }

                }

            }

        }

    }

    async _saveProvesCalculated(key = this.blockchain._blockchainFileName+"_proves_calculated"){


        let buffer = await this._SerializationProves();

        console.log("Save proof creator "+key);

        return (await this.db.save( key, buffer ));

    }

    async _loadProvesCalculated(key){

        if (key === undefined)
            key = this.blockchain._blockchainFileName+"_proves_calculated";

        console.log("Load proof creator "+key);

        try{

            let buffer = await this.db.get(key, 12000);

            if (buffer === null || !Buffer.isBuffer(buffer)) {
                console.error("Proof for key "+key+" was not found");
                return false;
            }

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