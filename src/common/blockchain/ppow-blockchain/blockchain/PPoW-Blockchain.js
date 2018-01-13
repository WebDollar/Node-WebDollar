import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import BlockchainMiningReward from "../../global/Blockchain-Mining-Reward";
import consts from 'consts/const_global'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

/**
 * PPoWBlockchain contains a chain of blocks based on Proof of Proofs of Work
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

    //Algorithm 4 aka bestArg
    compareProofs(proof1, proof2){

        let bestArg = (proof, b) => {

            //M ← {µ : |π↑µ {b :}| ≥ m} ∪ {0}
            //let M =

            //return max µ∈M {2^µ · | π↑µ {b : }| }
            //return max
        }

        //operator
        let intersection = [];

        //calculating the interesection
        for (let i=0; i<proof1.length; i++)
            for (let j=0; j<proof2.length; j++)
                if (proof1[i] === proof2[j]){
                    intersection.push(proof1[i]);
                    break;
                }

        //no interesection
        if (intersection.length === 0) return false;
        let b = intersection[intersection.length-1];

        //best-argm(πA, b) ≥ best-argm(πB, b)
        return bestArg(proof1, b) >= bestArg(proof2, b);

    }

}

export default PPoWBlockchain;