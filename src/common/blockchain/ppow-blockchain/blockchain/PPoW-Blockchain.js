import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import PPoWBlockchainProver from './prover/PPoW-Blockchain-Prover'
import PPowBlockchainVerifier from './verifier/PPoW-Blockchain-Verifier'

/**
 * NiPoPoW Blockchain contains a chain of blocks based on Proof of Proofs of Work
 */
class PPoWBlockchain extends InterfaceBlockchain {

    constructor (agent){

        super(agent);

        this.prover = new PPoWBlockchainProver(this, );
        this.verifier = new PPowBlockchainVerifier(this, );

    }

    async _blockIncluded(block){

        block.updateInterlink();


        if ( !block.blockValidation.blockValidationType["skip-calculating-block-nipopow-level"]) {
            this.prover.provesCalculated.updateBlock(block);
            block._provesClculatedInserted = true;
        }

        //TODO generate proofs as a LightNode
        if (!this.agent.light)
            if (!block.blockValidation.blockValidationType["skip-calculating-proofs"]){

                await this.prover.createProofs();

            }

    }


    async _loadBlockchain( indexStartLoadingOffset , indexStartProcessingOffset, numBlocks ){

        let oldProofActivated = this.prover.proofActivated;
        this.prover.proofActivated = false;

        let answer = false;
        try {
            answer = await InterfaceBlockchain.prototype._loadBlockchain.call(this, indexStartLoadingOffset , indexStartProcessingOffset, numBlocks );
        } catch (exception){

            console.error("loadBlockchain raised an error", exception);
        }

        this.prover.proofActivated = oldProofActivated;
        await this.prover.createProofs();

        return answer;

    }


}

export default PPoWBlockchain;