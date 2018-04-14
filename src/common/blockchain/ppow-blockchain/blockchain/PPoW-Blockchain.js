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

        let N = this.blocks.length;
        let prevBlock = (N >= 2) ? this.blocks[N-2] : null;

        block.updateInterlink(prevBlock);
        block.level = block.getLevel(); //computing the level


        //TODO generate proofs as a LightNode
        if (!this.agent.light)
            this.prover.createProofs();

    }


    async loadBlockchain(onlyLastBlocks = undefined){

        this.prover.proofActivated = false;

        try {
            await InterfaceBlockchain.prototype.loadBlockchain.call(this, onlyLastBlocks);
        } catch (exception){

            console.error("loadBlockchain raised an error", exception);
        }

        this.prover.proofActivated = true;


        this.prover.createProofs();

    }


}

export default PPoWBlockchain;