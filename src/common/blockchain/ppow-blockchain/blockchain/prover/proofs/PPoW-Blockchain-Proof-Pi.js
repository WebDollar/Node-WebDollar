/**
 * Known as π
 */

import PPoWBlockchainProofBasic from "./PPoW-Blockchain-Proof-Basic"

class PPowBlockchainProofPi extends PPoWBlockchainProofBasic{

    /**
     * Returns ths upchain of current chain(C ↑ µ).
     */
    blocksGreaterLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (miu <= this.blocks[i].level)
                list.push(this.blocks[i]);

        return new PPowBlockchainProofPi(list);
    }

    /**
     * Returns ths downchain of current chain(C ↓ µ).
     */
    blocksLessLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (this.blocks[i].level <= miu)
                list.push(this.blocks[i]);

        return new PPowBlockchainProofPi(list);
    }

    /**
     *
     * @param underlyingChain C
     * @param superChain C'
     */
    downSuperChainGetUnderlyingChain(underlyingChain ){

        //finding C[ C'[0] :
        let first = -1, last = -1;

        for (let i=0; i<this.blocks.length; i++)
            if (underlyingChain.blocks[i] === this.blocks[0]) {
                first = i;
                break;
            }

        //finding C[ : C'[-1] ]
        for (let i=0; i<underlyingChain.blocks.length; i++)
            if (underlyingChain.blocks[i] === this.blocks[this.blocks.length-1]) {
                last = i;
                break;
            }

        if (first === -1 || last === -1)
            return null;
        else {

            let newUnderlyingChain = new PPowBlockchainProofPi([]);

            if (last < first){
                let aux = last;
                last = first;
                first = aux;
            }

            for (let i=first; i<=last; i++)
                newUnderlyingChain.blocks.push(underlyingChain.blocks[i]);

            return newUnderlyingChain;
        }
    }


    importProofHeaders(blocksHeaders){

        blocksHeaders.forEach((blockHeader)=>{

            let block = this.blockchain.blockCreator.createEmptyBlock(blockHeader.height);
            block.import

        });

    }

}

export default PPowBlockchainProofPi;