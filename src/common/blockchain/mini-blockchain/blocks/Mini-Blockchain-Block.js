import consts from 'consts/const_global'

import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'

let inheritBlockchain;

if (consts.POPOW_ACTIVATED) inheritBlockchain = PPoWBlockchainBlock;
else  inheritBlockchain = InterfaceBlockchainBlock;


class MiniBlockchainBlock extends PPoWBlockchainBlock {


}

export default MiniBlockchainBlock