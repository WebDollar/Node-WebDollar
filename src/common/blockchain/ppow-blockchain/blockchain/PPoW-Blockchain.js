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

    }

    async blockchainBlocksRemoved(startingHeight, endingPosition){

        if ( !this.agent.light )
            for (let i=startingHeight; i<endingPosition; i++)
                this.prover.provesCalculated.deleteBlockCalculated(this.blocks[i])

    }

    async blockchainBlocksAdded(startingHeight, createProof=true){

        //TODO generate proofs as a LightNode
        if ( !this.agent.light ) {

            for (let i=startingHeight; i<this.blocks.length-1; i++) {
                this.blocks[i].level = this.blocks[i].getLevel(); //computing the level
                this.prover.provesCalculated.updateBlock( this.blocks[i] );
            }

            if (createProof)
                await this.prover.createProofs();
        }

    }

    async _loadBlockchain( indexStartLoadingOffset , indexStartProcessingOffset ){

        let answer = false;
        try {
            answer = await InterfaceBlockchain.prototype._loadBlockchain.call(this, indexStartLoadingOffset , indexStartProcessingOffset );
        } catch (exception){

            console.error("loadBlockchain raised an error", exception);
        }

        return answer;

    }


}

export default PPoWBlockchain;