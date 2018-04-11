import consts from 'consts/const_global'
const BigInteger = require('big-integer');

/**
 * Known as π
 */

class PPowBlockchainProofPi{

    constructor(blocks){

        this.blocks = blocks;

    }

    /**
     * Returns ths upchain of current chain(C ↑ µ).
     */
    blocksGreaterLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (miu <= this.blocks[i].level)
                list.push(this.blocks[i]);

        return list;
    }

    /**
     * Returns ths downchain of current chain(C ↓ µ).
     */
    blocksLessLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (this.blocks[i].level <= miu)
                list.push(this.blocks[i]);

        return list;
    }

    getProofHeaders(){

        let list = [];
        for (let i=0; i<this.blocks.length; i++)
            list.push( this.blocks[i].getBlockHeader() )

        return list;
    }










    /**
     * Definition 5 (Locally good superchain).
     * @param superLength
     * @param underlyingLength
     * @param miu
     * @returns {boolean}
     * @private
     */
    _localGood(superLength, underlyingLength, miu){

        //local-goodδ (C', C, µ), if |C0| > (1 − δ) 2^−µ * |C|.

        //using big Number
        if ( new BigInteger(superLength).greater( (new BigInteger(1).minus(consts.POPOW_PARAMS.d)).multiply( new BigInteger(2).pow( - miu ) * underlyingLength ) ))
            return true;
        else
            return false;
    }

    /**
     * Definition 6 (Superchain quality).
     * @param superchain
     * @param miu
     * @param m
     * @returns {boolean}
     * @private
     */
    _superchainQuality(miu, m){

        if (m < 1)
            throw ('superchainQuality is not good');

        if (this.blocks.length < m)
            return false;

        //m ∈ N states that for all m' ≥ m

        // local-good δ (C↑ µ [−m' :], C↑µ [−m' :]↓ , µ).

        let mP = m;
        while ( mP >= m  && mP <this.blocks.length){

            // C↑ µ
            let upperChain = this.blocksGreaterLevel(miu);

            // downchain C'↓ C is defined as C[ C'[0] : C'[−1] ].          simply write C'↓

            //finding C[ C'[0] :
            let first = -1;
            let last = -1;
            for (let i=0; i<this.blocks.length; i++)
                if (this.blocks[i] === upperChain[0]) {
                    first = i;
                    break;
                }

            //finding C'[ : C'[-1] ]
            for (let i=0; i<this.blocks.length; i++)
                if (this.blocks[i] === upperChain[upperChain.length-1]) {
                    last = i;
                    break;
                }

            let underlyingLength = last - first;

            if (this._localGood( m, underlyingLength , miu) === false)
                return false;

            m++;
        }

        return true;
    }

    /**
     * Definition 7 (Multilevel quality)
     * @param superchain
     * @param miu
     * @returns {boolean}
     * @private
     */
    _multilevelQuality(miu){


        //C ∗ = C [−m : ]
        for (let i = 0; i<this.blocks.length - consts.POPOW_PARAMS.k1; i++){

            //C∗ ⊆ C, if |C∗↑µ| ≥ k1

            let first = i;
            let last = this.blocks.length;

            let CStar = new PPowBlockchainProofPi([]);
            for (let j=first; j <=last; j++)
                CStar.push(this.blocks[j]);

            //any µ' < µ
            for (let miuP=miu; miuP >= 1; miuP--) {

                //should be optimized
                let upperChain = CStar.blocksGreaterLevel(miuP);

                //| C∗↑µ' | ≥ k1
                if (upperChain.length >= consts.POPOW_PARAMS.k1){

                    if ((CStar.blocksGreaterLevel(miu) >= (1 - consts.POPOW_PARAMS.d ) * new BigInteger(2).pow(miu - miuP) * upperChain ) === false)
                        return false;

                }

            }

        }

        return true;
        // TBD
    }

    /**
     * Definition 8 (Good superchain)
     * if it has both superquality and multilevel quality with parameters (δ, m)
     * @param superchain
     * @param miu
     * @returns {boolean}
     */
    good(miu){

        if (this._superchainQuality(miu) === false)
            return false;


        if (this._multilevelQuality(miu) === false)
            return false;

        return true;
    }







}

export default PPowBlockchainProofPi;