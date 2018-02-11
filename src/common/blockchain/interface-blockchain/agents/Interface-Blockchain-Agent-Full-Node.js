import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"

class InterfaceBlockchainAgentFullNode extends InterfaceBlockchainAgent{

    constructor(blockchain) {

        super(blockchain);

    }

    _initializeProtocol(){

        this.protocol.initialize(["acceptBlockHeaders", "acceptBlocks" ]);
    }

}

export default InterfaceBlockchainAgentFullNode;