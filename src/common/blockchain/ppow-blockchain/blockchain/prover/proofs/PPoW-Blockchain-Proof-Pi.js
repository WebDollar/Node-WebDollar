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

    /**
     *
     * @param underlyingChain C
     * @param superChain C'
     */
    downSuperChainGetUnderlyingChain(superChain, underlyingChain ){

        //finding C[ C'[0] :
        let first = -1, last = -1;

        for (let i=0; i<superChain.blocks.length; i++)
            if (underlyingChain.blocks[i] === superChain.blocks[0]) {
                first = i;
                break;
            }

        //finding C[ : C'[-1] ]
        for (let i=0; i<underlyingChain.blocks.length; i++)
            if (underlyingChain.blocks[i] === superChain.blocks[superChain.blocks.length-1]) {
                last = i;
                break;
            }

        if (first === -1 || last === -1)
            return null;
        else {

            let newUnderlyingChain = new PPowBlockchainProofPi([]);

            for (let i=first; i<=last; i++)
                newUnderlyingChain.blocks.push(underlyingChain.blocks[i]);

            return newUnderlyingChain;
        }
    }

    getProofHeaders(){

        let list = [];
        for (let i=0; i<this.blocks.length; i++)
            list.push( this.blocks[i].getBlockHeader() )

        return list;
    }


















}

export default PPowBlockchainProofPi;