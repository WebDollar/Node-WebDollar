/**
 * Known as χ
 */

class PPowBlockchainProofXi{

    constructor(blocks){

        this.blocks = blocks;

    }

    getProofHeaders(){

        let list = [];
        for (let i=0; i<this.blocks.length; i++)
            list.push( this.blocks[i].getBlockHeader() )

        return list;
    }

}

export default PPowBlockchainProofXi;