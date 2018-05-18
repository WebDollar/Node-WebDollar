import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import consts from 'consts/const_global'

class InterfaceBlockchainAgentFullNode extends InterfaceBlockchainAgent{

    constructor(blockchain) {

        super(blockchain);

    }

    _initializeProtocol(){

        this.protocol.initialize(["acceptBlockHeaders", "acceptBlocks" ]);
    }

}

export default InterfaceBlockchainAgentFullNode;