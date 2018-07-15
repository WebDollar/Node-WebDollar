import MiniBlockchainAdvanced from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain-Advanced'
import MiniBlockchainAdvancedVirtualized from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain-Advanced-Virtualized'
import MiniBlockchainLight from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain-Light'

let inheritedBlockchain;

const lightFullNodes = true;

if (process.env.BROWSER) inheritedBlockchain = MiniBlockchainLight;
else {

    if (lightFullNodes) inheritedBlockchain = MiniBlockchainAdvancedVirtualized;
        else inheritedBlockchain = MiniBlockchainAdvanced;

}

//inheritedBlockchain = MiniBlockchainLight;

class MainBlockchain extends  inheritedBlockchain{

}

export default MainBlockchain