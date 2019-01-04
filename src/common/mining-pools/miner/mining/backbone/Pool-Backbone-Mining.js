import BlockchainBackboneMining from "common/blockchain/interface-blockchain/mining/backbone/Blockchain-Backbone-Mining";
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from "consts/const_global";

class PoolBackboneMining extends BlockchainBackboneMining {


    constructor( blockchain, minerAddress, miningFeePerByte ){

        super(blockchain, minerAddress, miningFeePerByte);

        this.WORKER_NONCES_WORK = 0xFFFFFFFF;

        this.useResetConsensus = false;

    }


}

export default PoolBackboneMining;