import InterfaceBlockchainMiningWorkers from "../Interface-Blockchain-Mining-Workers";

const webWorkify = require ('webworkify');

/**3
 * WEBWORKIFY DOCUMENTATION ON https://github.com/browserify/webworkify
 */

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMiningWorkers{

    _getWorker(){
        return webWorkify(require('./Browser-Mining-Web-Worker.js'));
    }

}

export default InterfaceBlockchainBrowserMining