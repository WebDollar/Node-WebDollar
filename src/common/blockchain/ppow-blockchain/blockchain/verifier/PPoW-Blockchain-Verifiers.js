import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class PPoWBlockchainVerifiers {


    /**
     * Algorithm 2
     */
    verify(provers){

        if (!Array.isArray(provers))
            return false;

        let proofBest = BlockchainGenesis.prevHash;
        let lastBlocksBest = undefined;

        for (let i = 0; i < provers.length; ++i){
            let prover = provers[i];
            if (this.validateChain(prover.proofs, prover.lastBlocks) && prover.lastBlocks.length === consts.POPOW_PARAMS.k && this.compareProofs(prover.proofs, proofBest) ){

                proofBest = prover.proofs;
                lastBlocksBest = prover.lastBlocks;

            }
        }

        if (proofBest !== undefined)
            return {proofBest: proofBest, Q: this.predicateQ(proofBest)};

        return false;

    }


}

export default PPoWBlockchainVerifiers;