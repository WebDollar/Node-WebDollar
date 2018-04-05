import MiniBlockchainAdvanced from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain-Advanced'
import MiniBlockchainLight from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain-Light'

let inheritedBlockchain;

if (process.env.BROWSER) inheritedBlockchain = MiniBlockchainLight
else inheritedBlockchain = MiniBlockchainAdvanced;

//inheritedBlockchain = MiniBlockchainLight;

class MainBlockchain extends  inheritedBlockchain{

}

export default MainBlockchain