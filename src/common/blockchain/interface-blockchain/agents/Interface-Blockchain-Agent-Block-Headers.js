import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"
import InterfaceBlockchainAgentMinerPool from "./Interface-Blockchain-Agent-Miner-Pool";

// TODO not fully working for only headers

class InterfaceBlockchainAgentBlockHeaders extends InterfaceBlockchainAgentMinerPool{

    _initializeProtocol(){

        this.protocol.initialize(["acceptBlockHeaders"]);
    }

}

export default InterfaceBlockchainAgentBlockHeaders;