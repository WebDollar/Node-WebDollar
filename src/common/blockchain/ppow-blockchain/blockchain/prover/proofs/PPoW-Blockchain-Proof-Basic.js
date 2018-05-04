import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import consts from 'consts/const_global'

class PPoWBlockchainProofBasic{

    destroy(){

        this.blockchain = undefined;

        for (let i=0; i<this.blocks.length; i++)
            this.blocks[i].destroy();

    }

    constructor(blockchain, blocks){

        this.date = new Date();

        this.blockchain = blockchain;
        this.blocks = blocks;

        this.hash = undefined;
    }

    getProofHeaders(starting, length){

        let list = [];
        for (let i=starting; i<Math.min( starting+length, this.blocks.length); i++)
            list.push( this.blocks[i].getBlockHeader() )

        return list
    }

    validateProof(startingPoint = 0){

        if (!Array.isArray(this.blocks))
            throw {message: "proof blocks is invalid"};

        for (let i = startingPoint; i < this.blocks.length; ++i)
            if (!this.blocks[i]._validateInterlink())
                throw {message: "validate Interlink Failed"};

        return true;
    }

    validateProofLastElements(lastElements){

        return this.validateProof(this.blocks.length - lastElements);

    }

    //TODO should be optimized using Object {}
    hasBlock(height){

        for (let i=0; i<this.blocks.length; i++)
            if (this.blocks[i].height === height)
                return this.blocks[i];

        return null;

    }

    equalsProofs(proofHash){

        if ( typeof proofHash === "object" && proofHash.hasOwnProperty("hash") ) proofHash = proofHash.hash;

        if (proofHash.equals(this.hash))
            return true;

        return false;

    }

    calculateProofHash(){

        let buffers = [];
        for (let i=0; i <this.blocks.length; i++)
            buffers.push(this.blocks[i].hash);

        let buffer = Buffer.concat(buffers);

        this.hash = WebDollarCrypto.SHA256(buffer);

        return this.hash;

    }

    get lastProofBlock(){
        return this.blocks[this.blocks.length-1];
    }

    validatesLastBlock(){

        if (this.blocks.length <= 0) return false;
        if (this.blocks.length <= consts.POPOW_PARAMS.m) return false;

        try {

            if (this.blocks[this.blocks.length - 1].hash.equals( this.blockchain.blocks[this.blockchain.blocks.length - consts.POPOW_PARAMS.m - 1  ].hash ))
                return true;
            else
                return false;

        } catch (exception){

        }

    }

}

export default PPoWBlockchainProofBasic