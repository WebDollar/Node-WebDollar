import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended";
import PPowBlockchainProofPi from "../prover/proofs/PPoW-Blockchain-Proof-Pi";
const BigInteger = require('big-integer');
const BigNumber = require('bignumber.js');

class PPoWHelper{

    /**
     * LCA between too proofs. Each proof contains a blocks array
     * @param proofs1
     * @param proofs2
     * @returns {*}
     * @constructor
     */
    LCA(proofs1, proofs2){

        //LCA(C1, C2) = (C1 ∩ C2)[−1] π

        let i1 = proofs1.blocks.length - 1;
        let i2 = proofs2.blocks.length - 1;

        //Find LCA on path to Genesis
        while (i1 >= 0 && i2 >= 0) {

            const block1 = proofs1.blocks[i1];
            const block2 = proofs2.blocks[i2];

            if (block1.hash.equals( block2.hash ))
                return block1;
            else if (block1.height > block2.height)
                i1--;
            else
                i2--;
        }

        return null;
    }



    /**
     * Definition 5 (Locally good superchain).
     * @param µ-superchain C'
     * @param underlyingChain C
     * @param miu
     * @returns {boolean}
     * @private
     */
    _localGood(superLength, underlyingLength, miu){

        //local-goodδ (C', C, µ), if |C0| > (1 − δ) 2^−µ * |C|.

        //using big Number
        if ( new BigNumber(superLength).isGreaterThan( (new BigNumber(1).minus(consts.POPOW_PARAMS.d)).multipliedBy( new BigNumber(2).pow( - miu )).multipliedBy(underlyingLength) ))
            return true;
        else
            return false;
    }

    /**
     * Definition 6 (Superchain quality).
     * @param underlyingChain C
     * @param µ-superchain C'
     * @param miu
     * @param m
     * @returns {boolean}
     * @private
     */
    _superchainQuality( underlyingChain, superChain, miu){

        if (consts.POPOW_PARAMS.m < 1)
            throw {message: 'superchainQuality is not good'};

        if (superChain.blocks.length <= consts.POPOW_PARAMS.m)
            return false;

        //m ∈ N states that for all m' ≥ m

        // local-good δ (C↑ µ [−m' :], C↑µ [−m' :]↓ , µ).
        let mP = consts.POPOW_PARAMS.m;
        while (mP >= consts.POPOW_PARAMS.m  && mP < underlyingChain.blocks.length){

            // C↑µ [−m':]
            let upperChain = underlyingChain.blocksGreaterLevel(miu);

            // downChain C'↓ C is defined as C[ C'[0] : C'[−1] ].          simply write C'↓
            let downChain = upperChain.downSuperChainGetUnderlyingChain(underlyingChain, );

            if (! this._localGood( Math.min( upperChain.blocks.length, mP ), Math.min( downChain.blocks.length, mP ) , miu) )
                return false;

            mP++;
        }

        return true;
    }

    /**
     * Definition 7 (Multilevel quality)
     * @param underlyingChain C
     * @param µ-superchain C'
     * @param miu
     * @returns {boolean}
     * @private
     */
    _multilevelQuality(underlyingChain, superChain, miu){

        //from badness, we have this
        //C∗ ← C'↓↑µ'−1
        for (let miu1 = miu; miu1 >= 1; miu1 --){

            let CStar = superChain.downSuperChainGetUnderlyingChain(underlyingChain);
            CStar = CStar.blocksGreaterLevel(miu1 - 1);

            if (CStar === null) continue;

            //|C∗↑µ'|
            let upperChain = CStar.blocksGreaterLevel(miu1);

            //| C∗↑µ' | ≥ k1
            if (upperChain.blocks.length >= consts.POPOW_PARAMS.k1)

                if ( ! (CStar.blocksGreaterLevel(miu).blocks.length >= (1 - consts.POPOW_PARAMS.d ) * new BigInteger(2).pow(miu - miu1) * upperChain.blocks.length ) )
                    return false;

        }

        return true;
    }

    /**
     * Definition 8 (Good superchain)
     * if it has both superquality and multilevel quality with parameters (δ, m)
     * @param underlyingChain C
     * @param µ-superchain C'
     * @param miu
     * @returns {boolean}
     */
    good( underlyingChain, superChain, miu){

        if (this._superchainQuality(underlyingChain, superChain, miu) === false)
            return false;


        // if (this._multilevelQuality(underlyingChain, superChain, miu) === false)
        //     return false;

        return true;
    }






}

export default new PPoWHelper();