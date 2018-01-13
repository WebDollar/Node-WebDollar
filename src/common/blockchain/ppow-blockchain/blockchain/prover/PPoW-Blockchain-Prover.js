import consts from 'consts/const_global'
import PPoWHelper from './helpers/PPoW-Helper'

class PPoWBlockchainProver{

    constructor(blockchain, proofs, lastBlocks){

        this.blockchain = blockchain;

        this.proofs = proofs;
        this.lastBlocks = lastBlocks; //last blocks

    }

    createProofs(proofs){

    }

    createLastBlcoks(lastBlocks){

    }

    //Algorithm 3
    // will create Proofs ( π χ )
    createProve(){

        //B ← C[0]
        let B = this.blockchain.blocks[0];
        let proofs = [];

        let length =  this.blockchain.blocks.length;

        //for µ = |C[−k].interlink| down to 0 do
        for (let miu = this.blockchain.blocks[length - consts.POPOW_PARAMS.k].interlink.length -1; miu >=0; i--){

            //  α ← C[: −k]{B :}↑µ
            let alpha = [];
            for (let i = length-1; i>= length - consts.POPOW_PARAMS.k; i++)
                if (this.blockchain.blocks[i].height >= B.height &&   //C[: −k]{B :}
                    this.blockchain.blocks[i].getLevel() >= miu){

                    alpha.push(this.blockchain.blocks[i]);

                }

            // π ← π ∪ α
            for (let i=0; i<alpha.length; i++)
                proofs.push(alpha[i]);

            if (PPoWHelper.good(alpha, miu)){
                B = alpha [ alpha.length - consts.POPOW_PARAMS.m ];
            }


        }

        // χ ← C[−k : ]
        let lastBlocks = this.blockchain.blocks.splice(length - consts.POPOW_PARAMS.k);

        this.proofs = proofs;
        this.lastBlocks = lastBlocks;

    }

}

export default PPoWBlockchainProver;