import InterfaceBlockchainBackboneMining from "common/blockchain/interface-blockchain/mining/backbone/Interface-Blockchain-Backbone-Mining";
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from "consts/const_global";

class PoolBackboneMining extends InterfaceBlockchainBackboneMining {


    constructor(){

        super(undefined, undefined, 0);

        this.WORKER_NONCES_WORK = 0xFFFFFFFF;

    }

    mine(block, difficulty, start, end){

        this.started = true;

        return InterfaceBlockchainBackboneMining.prototype.mine(block, difficulty, start, end);

    }
}

export default PoolBackboneMining;