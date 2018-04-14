import MiniBlockchainAgentFullNode from 'common/blockchain/mini-blockchain/agents/Mini-Blockchain-Agent-Full-Node'
import MiniBlockchainAgentBlockHeaders from 'common/blockchain/mini-blockchain/agents/Mini-Blockchain-Agent-Block-Headers'
import MiniBlockchainAgentLightNode from 'common/blockchain/mini-blockchain/agents/Mini-Blockchain-Agent-Light-Node'

/**
 * MainBlockchainAgent inherit the entire MiniBlockchainAgent
 */

class MainBlockchainAgent{

    createAgent(agentName, blockchain){

        if (agentName === "headers-node")
            return new MiniBlockchainAgentBlockHeaders(blockchain);
        else
        if (agentName === "full-node")
            return new MiniBlockchainAgentFullNode(blockchain);
        else
        if (agentName === "light-node")
            return new MiniBlockchainAgentLightNode(blockchain);

        throw {message: "Couldn't create an agent"}
    }


}

export default new MainBlockchainAgent();