
import consts from 'consts/const_global'
import PPoWHelper from '../helpers/PPoW-Helper'
const BigInteger = require('big-integer');

class PPoWBlockchainVerifier{

    constructor(){

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
     * predicateQ validates the last blocks L
     * @param C - Chain
     * @returns Boolean
     */
    predicateQ(C){

        // undefined, if |C[: −k]| < l, otherwise:
        if (C.lastBlocks.length < consts.POPOW_PARAMS.l )
            throw {message: "Error, the Chain C doesn't have at least l security param blocks", l: consts.POPOW_PARAMS.l}

        // true, if ∃C1 ⊆ C[: −k] : |C1 | ≤ d ∧ D(C1)
        if (this.predicateD(C.accountantTree, C.lastBlocks))
            return true;

        throw {message: "predicateQ is invalid"};

    }

    /**
     * validate the accountantTree and the lastBlocks
     * @param accountantTree
     * @param lastBlocks
     */

    predicateD(accountantTree, lastBlocks){

        throw {message: "predicateD is invalid"}
    }

    /**
     * returns a list of Levels u which have at least m blocks with that level
     */
    calculateM(proofs, blockStop){

        let index;

        // Obs M is a counter of how many blocks have the level[i]
        // M[id] === undefined if there is no block of level id
        let M = [0];

        // { b : }
        if (blockStop !== undefined) {
            index = proofs.length - 1;
            while (index >= 0) {
                // { b : }
                if (proofs[index] === blockStop)
                    break;
                index--;
            }
        } else index = 0;


        while (index < proofs.length - 1){

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
     * @param proofs1
     * @param proofs2
     * @returns {boolean}
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

                    let formula = new BigInteger(2).pow(miu).mul(M[miu].length);
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
     * Algorithm 5 The badness prover which generates a succinct certificate of badness
     * @param proofs
     */
    badness(proofs){

        //M ← {µ : |C↑µ | ≥ m} \ {0}
        let M = this.calculateM(proofs);
        if (M[0] !== undefined)
            delete M[0];

        let max;
        for (max = M.length - 1; M[max] !== undefined && max >= 0; --max);

        if (max === 0)
            throw {message: 'max === 0', max};


        // ρ ← 1/ max(M)
        let p = 1 / max;

        for (let miu = 0; miu < M.length; miu++){
            if (M[miu] === undefined)
                continue;

            // B ∈ C↑µ
            let C = proofs.blocksGreaterLevel(miu);
            for (let i = 0; i < C.length; i++){

                let C1 = undefined;
                for (let j = i + 1; j < C.length; j++) {

                    // {B :}
                    C1.push(C[j]);

                    // [: m]
                    if (C1.length === consts.POPOW_PARAMS.m) // Sliding m-sized window
                        break;

                }

                //if |C1| = m then
                if (C1.length === consts.POPOW_PARAMS.m){

                    // C∗ ← C' ↓↑µ−1    //not C↓↑

                    //TODO CORRECT IT
                    let Cstar = proofs.blocksGreaterLevel(miu-1);

                    if ( new BigInteger( 2 * C1.length ).lesser( new BigInteger(1-consts.POPOW_PARAMS.d).pow(p) * Cstar.length  ) )
                        throw {message: "badness failed because of Cstar badness ", Cstar: Cstar}


                }

            }

        }

        return null;   // Chain is good
    }

}

export default PPoWBlockchainVerifier