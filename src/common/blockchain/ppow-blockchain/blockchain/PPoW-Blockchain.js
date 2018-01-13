import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import BlockchainMiningReward from "../../global/Blockchain-Mining-Reward";
import consts from 'consts/const_global'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

/**
 * NiPoPoW Blockchain contains a chain of blocks based on Proof of Proofs of Work
 */
class PPoWBlockchain extends InterfaceBlockchain {


    constructor (protocol){

        super(protocol);
    }

    async blockIncluded(block){

        let N = this.blocks.length;
        let prevBlock = (N >= 2) ? this.blocks[N-2] : null;

        block.updateInterlink(prevBlock);
    }

    // Algorithm 2
    verify(provers){

        if (!Array.isArray(provers)) return false;

        let proofBest = BlockchainGenesis.prevHash;
        let lastBlocksBest = undefined;

        for (let prover in provers){
            if (this.validateChain(prover.proofs, prover.lastBlocks) && prover.lastBlocks.length === consts.POPOW_PARAMS.k && this.compareProofs(prover.proofs, proofBest) ){

                proofBest = prover.proofs;
                lastBlocksBest = prover.lastBlocks;

            }
        }

        return predicateQ(proofBest);

        return false;

    }

    LCA(proofs1, proofs2){
        //LCA(C1, C2) = (C1 ∩ C2)[−1]

        for (let i=proofs1.length-1; i > 0; i--)
            for (let j=proofs2.length-1; j>0; j--){
                if (proofs1[i] === proofs2[j]){ //found the LCA
                    return proofs1[i];
                }
            }

        return null;

    }

    //Algorithm 4 aka bestArg
    compareProofs(proofs1, proofs2){

        let bestArg = (proofs, b) => {

            //M ← {µ : |π↑µ {b :}| ≥ m} ∪ {0}

            // Obs M is a level
            let M = [0];

            for (let miu = proofs.length-1; miu >= 0; i-- ) {

                // { b : }
                if (proofs[miu] === b) //finished,
                    break;

                // {µ : |π↑µ {b :}| ≥ m}
                if ( proofs[miu].length >= consts.POPOW_PARAMS.m ) M.push( miu );
            }

            //return max µ∈M {2^µ · | π↑µ {b : }| }
            let max = 0;
            for (let miu in M){

                let formula = 2^miu * proofs[miu].length;
                if ( max < formula )
                    max = formula;

            }

            return max
        };

        //calculating the interesection
        let b = this.LCA(proofs1, proofs2);

        //best-argm(πA, b) ≥ best-argm(πB, b)
        return bestArg(proofs1, b) >= bestArg(proofs2, b);

    }

}

export default PPoWBlockchain;