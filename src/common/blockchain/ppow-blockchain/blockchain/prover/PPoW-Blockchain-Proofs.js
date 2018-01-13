/**
 * Known as π
 */

class PPowBlockchainProofs{

    constructor(proofs){

        this.proofs = proofs;

    }

    // C ↑ µ
    blocksGreaterLevel(miu){

        let list = [];

        for (let i=0; i<this.proofs.length; i++)
            if (this.proofs[i].level >= miu)
                list.push(this.proofs[i]);

        return list;
    }

    // C ↓ µ
    blocksLessLevel(miu){

        let list = [];

        for (let i=0; i<this.proofs.length; i++)
            if (this.proofs[i].level <= miu)
                list.push(this.proofs[i]);

        return list;
    }

}

export default PPowBlockchainProofs;