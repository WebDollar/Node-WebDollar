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
            block.level = block.getLevel(); //computing the level
            this.prover.provesCalculated.updateBlock(block);
        }

        //TODO generate proofs as a LightNode
        if (!this.agent.light)
            if (!block.blockValidation.blockValidationType["skip-calculating-proofs"]){

                await this.prover.createProofs();

            }

    }


    async _loadBlockchain( indexStartLoadingOffset , indexStartProcessingOffset ){

        let oldProofActivated = this.prover.proofActivated;
        this.prover.proofActivated = false;

        try {
            if (! (await InterfaceBlockchain.prototype._loadBlockchain.call(this, indexStartLoadingOffset , indexStartProcessingOffset ))) return false;
        } catch (exception){

            console.error("loadBlockchain raised an error", exception);
        }

        this.prover.proofActivated = oldProofActivated;
        await this.prover.createProofs();

        return true;

    }


}

export default PPoWBlockchain;