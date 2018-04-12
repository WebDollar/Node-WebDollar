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

}

export default PPoWBlockchainProofBasic