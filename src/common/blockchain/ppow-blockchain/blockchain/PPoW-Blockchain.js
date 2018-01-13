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
        block.level = block.getLevel(); //computing the level
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

            //M ← {µ : |π↑µ {b :}| ≥ m } ∪ {0}

            // Obs M is a counter of how many blocks have the level[i]
            let M = [0];

            let index = proofs.length-1;
            while (index >= 0 ){

                // {µ : |π ↑µ {b :}| ≥ m}
                let miu = proofs[index].level;
                if (miu > consts.POPOW_PARAMS.m) {

                    if (M[miu] === undefined)  M[miu] = [];
                    M[miu].push(miu);
                }

                // { b : }
                if (proofs[index] === b) break;
            }

            //return max µ ∈ M {2^µ · | π↑µ {b : }| }
            let max = 0;
            for (let miu in M){

                let formula = new BigNumber(2).pow(miu).mul(M[miu].length);
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
     *
     */
    _localGood(superLength, underlyingLength, miu){

        //local-goodδ (C', C, µ), if |C0| > (1 − δ) 2^−µ * |C|.

        //using big Number
        if ( new BigNumber(superLength).greaterThan( (new BigNumber(1).minus(consts.POPOW_PARAMS.d)).mul( new BigNumber(2).pow( - miu ) * underlyingLength ) ))
            return true;
        else
            return false;
    }

    /**
     * Definition 6 (Superchain quality).
     */
    _superchainQuality(superchain, miu, m){

        if (m < 1) throw ('superchainQuality is not good');

        if (superchain.length < m) return false;

        //m ∈ N states that for all m' ≥ m

        // local-good δ (C↑ µ [−m' :], C↑µ [−m' :]↓ , µ).

        while ( m < superchain.length ){

            const underlyingLength = superchain.last.height - superchain.blocks[superchain.length - m].height + 1;

            if (this._localGood(m, underlyingLength , miu) === false)
                return false;

            m++;
        }

        return true;
    }

    /**
     * Definition 7 (Multilevel quality)
     */

    _multilevelQuality(superchain, miu){

        //C ∗ = C [−m : ]

        return true;
        // TBD
    }

    /**
     * Definition 8 (Good superchain)
     *
     *  if it has both superquality and multilevel quality with parameters (δ, m)
     */
    good(superchain, miu){

        if (this._superchainQuality(superchain, miu) === false) return false;
        if (this._multilevelQuality(superchain, miu) === false) return false;

        return true;

    }




}

export default PPoWBlockchain;