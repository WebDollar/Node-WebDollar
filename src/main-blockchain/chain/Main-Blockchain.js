import MiniBlockchain from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain'
import MiniBlockchainLight from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain-Light'

let inheritedBlockchain;

if (process.env.BROWSER) inheritedBlockchain = MiniBlockchainLight
else inheritedBlockchain = MiniBlockchain;

//inheritedBlockchain = MiniBlockchainLight;

class MainBlockchain extends  inheritedBlockchain{

}

export default MainBlockchain