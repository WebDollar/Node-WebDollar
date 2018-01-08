import consts from 'consts/const_global'

import InterfaceBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import PPoWlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'

let inheritBlockchainBlock;

if (consts.POPOW_ACTIVATED) inheritBlockchainBlock = PPoWlock;
else  inheritBlockchainBlock = InterfaceBlock;


class MiniBlockchainBlock extends inheritBlockchainBlock {


}

export default MiniBlockchainBlock