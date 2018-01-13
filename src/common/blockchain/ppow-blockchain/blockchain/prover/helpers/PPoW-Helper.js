class PPoWHelper{

    /**
     * Definition 5 (Locally good superchain).
     */
    localGood(){
        
    }

    /**
     * Definition 6 (Superchain quality).
     */
    suerchainQuality(){
    }

    /**
     * Definition 7 (Multilevel quality)
     */

    multilevelQuality(){

    }

    /**
     * Definition 8 (Good superchain)
     *
     *  if it has both superquality and multilevel quality with parameters (δ, m)
     */
    good(){

        if (this.superQuality() === false) return false;
        if (this.multilevelQuality() === false) return false;

    }

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