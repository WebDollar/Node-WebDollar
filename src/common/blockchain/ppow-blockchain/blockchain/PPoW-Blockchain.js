import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import BlockchainMiningReward from "../../global/Blockchain-Mining-Reward";
import consts from 'consts/const_global'
var BigNumber = require('bignumber.js');
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import PPoWBlockchainProver from './prover/PPoW-Blockchain-Prover'
import PPoWHelper from './prover/helpers/PPoW-Helper'
import PPowBlockchainProofs from './prover/PPoW-Blockchain-Proofs'

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

    async validateBlockchain() {

    }

    validateChain(proofs, lastBlocks){

        //TODO: Check if another validation is required

        if (!Array.isArray(proofs) || !Array.isArray(lastBlocks))
            return false;

        for (let i = 0; i < proofs.length; ++i)
            if (!proofs.blocks[i]._validateInterlink())
                return false;

        for (let i = 0; i < lastBlocks.length; ++i)
            if (!lastBlocks.blocks[i]._validateInterlink())
                return false;

        return true;
    }


    /**
     * Algorithm 2
      */
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
            return {proofBest: proofBest, Q: this.predicateQ(proofBest)};

        return false;

    }

    /**
     * Algorithm 8 The verify algorithm for the NIPoPoW infix protocol
     * @param Provers
     */

    verifyInfix(Provers){

        let blockById = [];

        for (let prover in Provers)
            for (let B in prover.proofs.blocks)

                // blockById[B.id] ← B
                blockById[B.hash] = B

        let proofBest = this.verify(Provers).proofBest;

        // if |π˜[−1].index| < ` then
        // TODO who is index ????
        if (proofBest[proofBest.length-1].interlink.length < l)
            return null;
        else
            return this.D(ancestors(proofBest[proofBest.length-1], blockById));

    }

    predicateQ(C){

        // undefined, if |C[: −k]| < l, otherwise:
        if (C.length - consts.POPOW_PARAMS.k < consts.POPOW_PARAMS.l ) return undefined;

        let CTest = C.splice(C.length-consts.POPOW_PARAMS.k);

        // TODO

        // true, if ∃C1 ⊆ C[: −k] : |C1 | ≤ d ∧ D(C1)

        return false;

    }

    D(){

    }

    /**
     * returns a list of Levels u which have at least m blocks with that level
     */
    calculateM(proofs, blockStop){

        let index;

        // Obs M is a counter of how many blocks have the level[i]
        let M = [0];

        // { b : }
        if (blockStop !== undefined) {
            index = proofs.length-1;
            while (index >= 0) {
                // { b : }
                if (proofs[index] === blockStop) break;
                index--;
            }
        } else index = 0;


        while (index < proofs.length-1){

            index++;

            // {µ : |π ↑µ {b :}| ≥ m}
            let miu = proofs[index].level;
            if (miu > consts.POPOW_PARAMS.m) {
                if (M[miu] === undefined)  M[miu] = [];
                M[miu].push(index);
            }

        }

    }

    /**
     * Algorithm 4. Compare 2 proofs. aka bestArg
     * @param Provers
     */
    compareProofs(proofs1, proofs2){

        let bestArg = (proofs, b) => {

            //M ← {µ : |π↑µ {b :}| ≥ m } ∪ {0}

            // Obs M is a counter of how many blocks have the level[i]
            let M = this.calculateM(proofs, b);


            //return max µ ∈ M {2^µ · | π↑µ {b : }| }
            let max = 0;
            for (let i = 0; i < M.length; ++i)
                //if there are blocks of level i
                if (M[i].length > 0){
                    let miu = i;

                    let formula = new BigNumber(2).pow(miu).mul(M[miu].length);
                    if ( max < formula )
                        max = formula;
                }

            return max;
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
    static _superchainQuality(superchain, miu, m){

        if (m < 1) throw ('superchainQuality is not good');

        if (superchain.length < m) return false;

        //m ∈ N states that for all m' ≥ m

        // local-good δ (C↑ µ [−m' :], C↑µ [−m' :]↓ , µ).

        while ( m < superchain.length ){

            // TODO !!!!!! maybe it will require an min

            const underlyingLength = superchain.last.height - superchain.blocks[superchain.length - m].height + 1; // I think it is without +1

            // C'length = m
            // C.length = underlingLength

            if (this._localGood( Math.min( m, superchain.length ), underlyingLength , miu) === false)
                return false;

            m++;
        }

        return true;
    }

    /**
     * Definition 7 (Multilevel quality)
     */

    static _multilevelQuality(superchain, miu){

        //C ∗ = C [−m : ]

        return true;
        // TBD
    }

    /**
     * Definition 8 (Good superchain)
     *
     *  if it has both superquality and multilevel quality with parameters (δ, m)
     */
    static good(superchain, miu){

        if (PPoWBlockchain._superchainQuality(superchain, miu) === false) return false;
        if (PPoWBlockchain._multilevelQuality(superchain, miu) === false) return false;

        return true;

    }


    /**
     * Algorithm 5 The badness prover which generates a succinct certificate of badness
     * @param proofs
     */
    badness(proofs){

        //M ← {µ : |C↑µ | ≥ m} \ {0}
        let M = this.calculateM(proofs)
        if (M[0] !== undefined)
            delete M[0];

        let max = 0;
        for (let u in M)
            if (max < u) max = u;

        if (max === 0) throw 'max === 0';


        // ρ ← 1/ max(M)
        let p = 1 / max;

        for (let miu in M){

            // B ∈ C↑µ
            let C = proofs.blocksGreaterLevel(miu);
            for (let i=0; i<C.length; i++){

                let C1 = undefined;
                for (let j=i+1; j<C.length; j++) {

                    // {B :}
                    C1.push(C[j]);

                    // [: m]
                    if (C1.length === consts.POPOW_PARAMS.m) break;   // Sliding m-sized window

                }

                //if |C1| = m then
                if (C1.length === consts.POPOW_PARAMS.m){

                    // C∗ ← C↓↑µ−1
                    // TODO DEFINE Cstar

                    let Cstar = [];

                    if ( new BigNumber( 2 * C1.length ).lessThan(  new BigNumber(1-consts.POPOW_PARAMS.d).pow(p) * Cstar.length  ) )

                        return Cstar; //Chain is bad


                }

            }

        }
        return null;   // Chain is good

    }

}

export default PPoWBlockchain;