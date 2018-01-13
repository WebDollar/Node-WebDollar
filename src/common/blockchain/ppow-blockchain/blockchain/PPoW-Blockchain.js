import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import BlockchainMiningReward from "../../global/Blockchain-Mining-Reward";
import consts from 'consts/const_global'
var BigNumber = require('bignumber.js');
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import PPoWBlockchainProver from './prover/PPoW-Blockchain-Prover'
import PPoWHelper from './prover/helpers/PPoW-Helper'
/**
 * NiPoPoW Blockchain contains a chain of blocks based on Proof of Proofs of Work
 */
class PPoWBlockchain extends InterfaceBlockchain {


    constructor (protocol){

        super(protocol);
    }

    async blockIncluded(block){

        let N = this.blocks.length;
        let prevBlock = (N >= 2) ? this.blocks[N-2] : null;

        block.updateInterlink(prevBlock);
    }

    // Algorithm 2
    verify(provers){

        if (!Array.isArray(provers)) return false;

        let proofBest = BlockchainGenesis.prevHash;
        let lastBlocksBest = undefined;

        for (let prover in provers){
            if (this.validateChain(prover.proofs, prover.lastBlocks) && prover.lastBlocks.length === consts.POPOW_PARAMS.k && this.compareProofs(prover.proofs, proofBest) ){

                proofBest = prover.proofs;
                lastBlocksBest = prover.lastBlocks;

            }
        }

        if (proofBest !== undefined)
            return predicateQ(proofBest);

        return false;

    }



    //Algorithm 4 aka bestArg
    compareProofs(proofs1, proofs2){

        let bestArg = (proofs, b) => {

            //M ← {µ : |π↑µ {b :}| ≥ m} ∪ {0}

            // Obs M is a level
            let M = [0];

            for (let miu = proofs.length-1; miu >= 0; miu-- ) {

                // { b : }
                if (proofs[miu] === b) //finished,
                    break;

                // {µ : |π ↑µ {b :}| ≥ m}
                for (let i=0; i < )
                if ( proofs[miu].length >= consts.POPOW_PARAMS.m ) M.push( miu );
            }

            //return max µ∈M {2^µ · | π↑µ {b : }| }
            let max = 0;
            for (let miu in M){

                let formula = 2^miu * proofs[miu].length;
                if ( max < formula )
                    max = formula;

            }

            return max
        };

        //calculating the interesection
        let b = PPoWHelper.LCA(proofs1, proofs2);

        //best-argm(πA, b) ≥ best-argm(πB, b)
        return bestArg(proofs1, b) >= bestArg(proofs2, b);

    }



    /**
     * Definition 5 (Locally good superchain).
     */
    localGood(proofs, miu){

        //local-goodδ (C', C, µ), if |C0| > (1 − δ) 2^−µ * |C|.

        //using big Number
        if ( new BigNumber(proofs.data.length).greaterThan( (new BigNumber(1).minus(consts.POPOW_PARAMS.d)).mul( new BigNumber(2).pow( - miu ) * this.blocks.length ) )
            return true;
        else
            return false;
    }

    /**
     * Definition 6 (Superchain quality).
     */
    superchainQuality(proofs, miu){
    }

    /**
     * Definition 7 (Multilevel quality)
     */

    multilevelQuality(proofs, miu){

    }

    /**
     * Definition 8 (Good superchain)
     *
     *  if it has both superquality and multilevel quality with parameters (δ, m)
     */
    good(proofs, miu){

        if (this.superchainQuality(proofs, miu) === false) return false;
        if (this.multilevelQuality(proofs, miu) === false) return false;

        return true;

    }


}

export default PPoWBlockchain;