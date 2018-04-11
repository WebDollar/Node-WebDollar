import consts from 'consts/const_global'
import PPoWHelper from '../helpers/PPoW-Helper'
import PPowBlockchainProofPi from './proofs/PPoW-Blockchain-Proof-Pi'
import PPowBlockchainProofXi from './proofs/PPoW-Blockchain-Proof-Xi'


class PPoWBlockchainProver{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    /**
     * Algorithm 3
     * will create Proofs ( π χ )
     *
     * create prover
     */

    _createProofPi(chain){

        //B ← C[0]
        let B = chain.blocks[0];

        // π
        let proofPi = new PPowBlockchainProofPi([]);

        let chainLength =  chain.blocks.length;

        try {
            //for µ = |C[−k].interlink| down to 0 do
            for (let miu = chain.blocks[chainLength - consts.POPOW_PARAMS.k].interlink.length - 1; miu >= 0; --miu) {

                //  α ← C[: −k]{B :}↑µ
                let alpha = [];
                for (let i = 0; i < chainLength - consts.POPOW_PARAMS.k; ++i)
                    if (chain.blocks[i].height >= B.height &&   //C[: −k]{B :}
                        chain.blocks[i].getLevel() >= miu) {

                        alpha.push(chain.blocks[i]);
                    }

                // π ← π ∪ α
                for (let i = 0; i < alpha.length; ++i)
                    proofPi.blocks.push(alpha[i]);

                //if goodδ,m(C, α, µ)
                if (PPoWHelper.good(alpha, miu)) {
                    B = alpha[alpha.length - consts.POPOW_PARAMS.m];
                }

            }

        } catch (exception){

            console.error( "_createProofPi" , exception);

        }

        return proofPi;

    }

    _createProofXi(chain){

        // χ ← C[−k : ]
        let proofXi = new PPowBlockchainProofXi( chain.blocks.slice( - consts.POPOW_PARAMS.k) );

        return proofXi;
    }

    createProofs(){

        this.proofPi = this._createProofPi(this.blockchain);
        this.proofXi = this._createProofXi(this.blockchain);

    }

}

export default PPoWBlockchainProver;