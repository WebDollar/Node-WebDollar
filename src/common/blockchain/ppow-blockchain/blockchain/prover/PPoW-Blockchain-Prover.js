import consts from 'consts/const_global'
import PPoWHelper from '../helpers/PPoW-Helper'
import PPowBlockchainProofPi from './proofs/PPoW-Blockchain-Proof-Pi'
import PPowBlockchainProofXi from './proofs/PPoW-Blockchain-Proof-Xi'
import PPoWBlockchainVerifier from "./../verifier/PPoW-Blockchain-Verifier"

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
        // π is underlyingChain


        let underlyingChain = new PPowBlockchainProofPi([]);

        let chainLength =  chain.blocks.length;

        try {
            //for µ = |C[−k].interlink| down to 0 do

            if (chainLength - consts.POPOW_PARAMS.k >= 0)
                for (let miu = chain.blocks[chainLength - consts.POPOW_PARAMS.k].interlink.length; miu >= 0; --miu) {

                    //  α ← C[: −k]{B :}↑µ
                    //  α is superChain
                    let superChain = new PPowBlockchainProofPi([]);

                    for (let i = 0; i < chainLength - consts.POPOW_PARAMS.k; ++i)
                        if (chain.blocks[i].height >= B.height &&   //C[: −k]{B :}
                            chain.blocks[i].getLevel() >= miu) {

                            superChain.blocks.push(chain.blocks[i]);
                        }

                    // π ← π ∪ α
                    for (let i = 0; i < superChain.blocks.length; ++i) {

                        //avoiding to be included multiple times
                        let found = false;
                        for (let j=0; j<underlyingChain.blocks.length; j++)
                            if (underlyingChain.blocks[j].height === superChain.blocks[i].height ){
                                found = true;
                                break;
                            }

                        if (!found)
                            underlyingChain.blocks.push(superChain.blocks[i]);
                    }

                    //if goodδ,m(C, α, µ)
                    if (PPoWHelper.good(underlyingChain, superChain, miu) ) {
                        console.log(PPoWHelper.good(underlyingChain, superChain, miu));
                        B = superChain.blocks[superChain.blocks.length - consts.POPOW_PARAMS.m];
                    }


                }

        } catch (exception){

            console.error( "_createProofPi" , exception);

        }

        console.warn("########################### underlyingChain", underlyingChain.length );



        return underlyingChain;

    }

    _createProofXi(chain){

        // χ ← C[−k : ]
        let blocks = [];
        for (let i=chain.blocks.length - consts.POPOW_PARAMS.k; i<chain.blocks.length; i++)
            if (i >= 0)
                blocks.push(chain.blocks[i]);

        let proofXi = new PPowBlockchainProofXi( blocks );

        return proofXi;
    }

    createProofs(){

        this.proofPi = this._createProofPi(this.blockchain);
        this.proofXi = this._createProofXi(this.blockchain);

        this.blockchain.verifier.validateChain(this.proofPi, this.proofXi);

    }

}

export default PPoWBlockchainProver;