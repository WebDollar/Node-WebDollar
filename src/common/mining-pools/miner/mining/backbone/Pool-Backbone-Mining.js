import BlockchainBackboneMining from "common/blockchain/interface-blockchain/mining/backbone/Blockchain-Backbone-Mining";
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from "consts/const_global";

class PoolBackboneMining extends BlockchainBackboneMining {


    constructor(){

        super(undefined, undefined, 0);

        this.WORKER_NONCES_WORK = 0xFFFFFFFF;

        this.useResetConsensus = false;

    }

    calculateHash(nonce){
        return InterfaceBlockchainBlock.computeHashStatic(this.block, nonce);
    }


}

export default PoolBackboneMining;