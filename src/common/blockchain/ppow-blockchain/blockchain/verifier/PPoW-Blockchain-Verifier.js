
import consts from 'consts/const_global'
import PPoWHelper from '../helpers/PPoW-Helper'
const BigInteger = require('big-integer');

class PPoWBlockchainVerifier{

    constructor(blockchain){

        this.blockchain = blockchain;
        this.prevProofs = [];
    }


    validateChain(proofPi, proofXi){

        //TODO: Check if another validation is required
        if (!proofPi.validateProof()) throw {message: "proofPi failed"};

      //  if (!proofXi.validateProof()) throw {message: "proofXi failed"};

        if (proofPi.blocks.length > 0)
            this.prevProofs.push( proofPi );

        for (let i=this.prevProofs.length-1; i>=0; i--)
            for (let j=this.prevProofs.length-1; j >= 0; j--){

                let answer = this.compareProofs(this.prevProofs[i], this.prevProofs[j]);
                console.info("comparison", i ,j, answer);

            }

        // for (let i=0; i<this.prevProofs.length; i++) {
        //
        //     let pos1 = Math.floor( Math.random() * this.prevProofs.length  );
        //
        //     for (let j = 0; j < this.prevProofs.length; j++) {
        //
        //         let pos2 = j; // Math.floor (Math.random() * this.prevProofs.length );
        //
        //         let answer = this.compareProofs(this.prevProofs[pos1], this.prevProofs[pos2]);
        //         if (pos1 > pos2) console.info("comparison", pos1, pos2, answer, true);
        //         else console.info("comparison", pos1, pos2, answer, false);
        //
        //     }
        // }

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
     * Algorithm 4. Compare 2 proofs. aka bestArg
     * @param proofs1
     * @param proofs2
     * @returns {boolean}
     */
    compareProofs(proofPi1, proofPi2){

        let bestArg = (proofPi, b) => {

            //M ← {µ : |π↑µ {b :}| ≥ m } ∪ {0}

            // Obs M is a counter of how many blocks have the level[i]
            let M = this.calculateM(proofPi, b);


            //return max µ ∈ M {2^µ · | π↑µ {b : }| }
            let max = 0;
            for (let i = 0; i < M.length; ++i)
                //if there are blocks of level i
                if (M[i] > 0){
                    let miu = i;

                    let formula = new BigInteger(2).pow(miu).multiply(M[miu]);
                    if ( max < formula )
                        max = formula;
                }

            return max;
        };

        //calculating the interesection
        let b = PPoWHelper.LCA(proofPi1, proofPi2);

        //best-argm(πA, b) ≥ best-argm(πB, b)
        return bestArg(proofPi1, b) >= bestArg(proofPi2, b);

    }


    /**
     * returns a list of Levels u which have at least m blocks with that level
     */
    calculateM(proofPi, blockStart){

        let index;

        // Obs M is a counter of how many blocks have the level[i]
        // M[id] === undefined if there is no block of level id
        let M = [0]

        // optimization
        // { b : }
        if (blockStart !== undefined) {
            index = proofPi.blocks.length - 1;
            while (index >= 0) {
                // { b : }
                if (proofPi.blocks[index] === blockStart)
                    break;
                index--;
            }
        } else index = 0;


        let levels = [];
        while (index < proofPi.blocks.length - 1){

            index++;

            // {µ : |π ↑µ {b :}| ≥ m}
            let miu = proofPi.blocks[index].level;

            //mark that I have a block with all the levels from [0... miu]
            for (let level=0; level<miu; level++) {

                if (levels[level] === undefined) levels[level] = 0;
                levels[level]++;

            }

        }

        for (let miu=0; miu<levels.length; miu++)
            if (levels[miu] >= consts.POPOW_PARAMS.m){
                    M[miu] = levels[miu] ;
                }

        return M;

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

                    // C∗ ← C'↓ ↑µ−1    //not C↓↑

                    //TODO CORRECT IT
                    let CStar = proofs.downSuperChainGetUnderlyingChain(C1);
                    Cstar = Cstar.blocksGreaterLevel(miu-1);

                    if ( new BigInteger( 2 * C1.length ).lesser( new BigInteger(1-consts.POPOW_PARAMS.d).pow(p) * Cstar.length  ) )
                        throw {message: "badness failed because of Cstar badness ", Cstar: Cstar}


                }

            }

        }

        return null;   // Chain is good
    }

}

export default PPoWBlockchainVerifier