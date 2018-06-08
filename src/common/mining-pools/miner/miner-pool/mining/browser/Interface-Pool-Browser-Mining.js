import InterfaceBlockchainBrowserMining from "common/blockchain/interface-blockchain/mining/browser/Interface-Blockchain-Browser-Mining";
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from "consts/const_global";

class InterfacePoolBrowserMining extends InterfaceBlockchainBrowserMining{

    constructor(miningFeeThreshold){

        super ( miningFeeThreshold );

    }

}

export default InterfacePoolBrowserMining;