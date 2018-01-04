import InterfaceBlockchainMiningWorkers from "../Interface-Blockchain-Mining-Workers";

const webWorkify = require ('webworkify');

/**3
 * WEBWORKIFY DOCUMENTATION ON https://github.com/browserify/webworkify
 */

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMiningWorkers{

    constructor (blockchain, minerAddress){
        super(blockchain, minerAddress);
    }

    getWorker(){
        return webWorkify(require('./Browser-Mining-WebWorker.js'));
    }

}

export default InterfaceBlockchainBrowserMining