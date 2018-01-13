import consts from 'consts/const_global'

class PPoWHelper{


    /**
     * LCA between too proofs
     */

    LCA(proofs1, proofs2){

        //LCA(C1, C2) = (C1 ∩ C2)[−1] π

        for (let i=proofs1.length-1; i > 0; i--)
            for (let j=proofs2.length-1; j>0; j--){
                if (proofs1[i] === proofs2[j]){ //found the LCA
                    return proofs1[i];
                }
            }

        return null;

    }


}

export default new PPoWHelper();