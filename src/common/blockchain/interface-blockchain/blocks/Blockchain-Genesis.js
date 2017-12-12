class BlockchainGenesis{

    constructor(){

        this.hashPrev = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa", "hex")

        this.timeStamp = 0x5A2FC60F;

        this.difficultyTarget = new Buffer ( "FF978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex" ); //hard difficulty
        //this.difficultyTarget = new Buffer ( [0xff, 0xff, 0xff] ); // easy difficulty

        this.address = "1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX"; // genesis address
    }

    validateGenesis(block){

        if (! Buffer.isBuffer(block.hasPrev)) throw 'HashPrev is invalid ';
        if (! block.hashPrev.equals( this.hashPrev) ) throw 'HashPrev is not equal with Genesis HashPrev ';

        if (! block.equals( this.hashPrev) ) throw 'HashPrev is not equal with Genesis HashPrev ';

        if ( block.timeStamp.length === this.timeStamp.length ) throw "Timestamp doesn't match";
        if ( block.timeStamp[0] !== 0 || block.timeStamp[1] !== 0 || block.timeStamp[2] !== 0 || block.timeStamp[3] !== 0) throw "Timestamp is too old";
    }

}

export default new BlockchainGenesis();