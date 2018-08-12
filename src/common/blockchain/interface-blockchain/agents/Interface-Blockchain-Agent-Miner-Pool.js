import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import Blockchain from "main-blockchain/Blockchain"

let NodeExpress;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
}

/**
 * This is the Agent used to control the status when you are mining in a Pool
 */

class InterfaceBlockchainAgentMinerPool  extends InterfaceBlockchainAgent {

    _determineSynchronizedSlaves(){

        return InterfaceBlockchainAgent.prototype._determineSynchronizedSlaves.call(this) && !Blockchain.isPoolActivated && !Blockchain.MinerPoolManagement.minerPoolStarted;

    }

}

export default InterfaceBlockchainAgentMinerPool;