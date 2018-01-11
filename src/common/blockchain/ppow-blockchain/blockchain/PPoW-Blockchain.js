import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import BlockchainMiningReward from "../../global/Blockchain-Mining-Reward";

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

}

export default PPoWBlockchain;