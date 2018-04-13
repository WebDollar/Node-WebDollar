import BufferExtended from "common/utils/BufferExtended"

class PPoWBlockchainProofBasic{


    constructor(blockchain, blocks){

        this.blockchain = blockchain;
        this.blocks = blocks;

    }

    getProofHeaders(){

        let list = [];
        for (let i=0; i<this.blocks.length; i++)
            list.push( this.blocks[i].getBlockHeader() )

        return list;
    }


    validateProof(){

        if (!Array.isArray(this.blocks))
            throw {message: "proof blocks is invalid"};

        for (let i = 0; i < this.blocks.length; ++i)
            if (!this.blocks[i]._validateInterlink())
                throw {message: "validate Interlink Failed"};

        return true;
    }

    validateProofLastElements(lastElements){

        if (!Array.isArray(this.blocks))
            throw {message: "proof blocks is invalid"};

        for (let i = this.blocks.length - lastElements; i < this.blocks.length; ++i)
            if (!this.blocks[i]._validateInterlink())
                throw {message: "validate Interlink Failed"};

        return true;
    }

    //TODO should be optimized using Object {}
    hasBlock(height){

        for (let i=0; i<this.blocks.length; i++)
            if (this.blocks[i].height === height)
                return this.blocks[i];

        return null;

    }

    equalsProofs(proof2){

        if (this.blocks.length !== proof2.blocks.length)
            return false;

        for (let i=0; i<this.blocks.length; i++){

            if (this.blocks[i].height !== proof2.blocks[i].height) return false;
            if (! BufferExtended.safeCompare(this.blocks[i].hash, proof2[i].blocks[i].blockId)) return false;
            if (! BufferExtended.safeCompare(this.blocks[i].difficultyTarget, proof2[i].blocks[i].difficultyTarget)) return false;
            if (! BufferExtended.safeCompare(this.blocks[i].data.hashData, proof2[i].blocks[i].data.hashData)) return false;

        }

        return true;

    }

}

export default PPoWBlockchainProofBasic