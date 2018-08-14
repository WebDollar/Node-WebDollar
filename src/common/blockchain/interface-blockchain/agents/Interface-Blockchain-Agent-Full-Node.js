import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import consts from 'consts/const_global'
import InterfaceBlockchainAgentMinerPool from "./Interface-Blockchain-Agent-Miner-Pool";

class InterfaceBlockchainAgentFullNode extends InterfaceBlockchainAgentMinerPool{

    constructor(blockchain) {

        super(blockchain);

    }

    _initializeProtocol(){

        this.protocol.initialize(["acceptBlockHeaders", "acceptBlocks" ]);
    }

}

export default InterfaceBlockchainAgentFullNode;