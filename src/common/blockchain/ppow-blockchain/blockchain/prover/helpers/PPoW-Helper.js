import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended";

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

        let i1 = proofs1.length - 1;
        let i2 = proofs2.length - 1;

        //Find LCA on path to Genesis
        while (i1 >= 0 && i2 >= 0) {
            const block1 = proofs1.blocks[i1];
            const block2 = proofs2.blocks[i2];

            if (BufferExtended.safeCompare(block1, block2))
                return block1;
            else if (block1.height > block2.height)
                i1--;
            else
                i2--;
        }

        return null;
    }


}

export default new PPoWHelper();