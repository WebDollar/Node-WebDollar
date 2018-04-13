class PPoWBlockchainProofBasic{


    constructor(blocks){
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

    //TODO should be optimized using Object {}
    hasBlock(height){

        for (let i=0; i<this.blocks.length; i++)
            if (this.blocks[i].height === height)
                return this.blocks[i];

        return null;

    }

}

export default PPoWBlockchainProofBasic