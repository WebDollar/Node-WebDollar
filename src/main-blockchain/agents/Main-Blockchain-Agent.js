import MiniBlockchainAgentFullNode from 'common/blockchain/mini-blockchain/agents/Mini-Blockchain-Agent-Full-Node'
import MiniBlockchainAgentBlockHeaders from 'common/blockchain/mini-blockchain/agents/Mini-Blockchain-Agent-Block-Headers'

/**
 * MainBlockchainAgent inherit the entire MiniBlockchainAgent
 *
 */
class MainBlockchainAgent{

    createAgent(agentName, blockchain){

        if (agentName === "headers-node")
            return new MiniBlockchainAgentBlockHeaders(blockchain);
        else
        if (agentName === "full-node")
            return new MiniBlockchainAgentFullNode(blockchain);

        throw ("Couldn't create an agent")
    }


}

export default new MainBlockchainAgent();