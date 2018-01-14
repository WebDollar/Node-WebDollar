/**
 * Known as π
 */

class PPowBlockchainProofs{

    constructor(blocks){

        this.blocks = blocks;

    }

    // C ↑ µ
    blocksGreaterLevel(miu){

        let list = [];

        for (let i=0; i<this.blocks.length; i++)
            if (this.blocks[i].level >= miu)
                list.push(this.proofs[i]);

        return list;
    }

    // C ↓ µ
    blocksLessLevel(miu){

        let list = [];

        for (let i=0; i<this.blocks.length; i++)
            if (this.blocks[i].level <= miu)
                list.push(this.blocks[i]);

        return list;
    }

}

export default PPowBlockchainProofs;