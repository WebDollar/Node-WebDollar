import InterfaceBlockchainMiningWorkers from "../Interface-Blockchain-Mining-Workers";

import webWorkify from 'webworkify-webpack';
//const webWorkify = require ('webworkify');

/**3
 * WEBWORKIFY DOCUMENTATION ON https://github.com/browserify/webworkify
 */

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMiningWorkers{

    _getWorker(){
        //let code = require('./Browser-Mining-Web-Worker.js');
        let code = require.resolve('./Browser-Mining-Web-Worker.js');
        return webWorkify(code);
    }

}

export default InterfaceBlockchainBrowserMining