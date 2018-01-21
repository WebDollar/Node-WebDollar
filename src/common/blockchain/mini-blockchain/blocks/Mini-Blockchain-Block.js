import consts from 'consts/const_global'

import InterfaceBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import PPoWBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'

let inheritBlockchainBlock;

if (consts.POPOW_ACTIVATED) inheritBlockchainBlock = PPoWBlock;
else  inheritBlockchainBlock = InterfaceBlock;


class MiniBlockchainBlock extends inheritBlockchainBlock {

    getBlockHeader(){

        let result = inheritBlockchainBlock.prototype.getBlockHeader.call(this);

        result.header.data.hashAccountantTree = this.data.hashAccountantTree;

        return result;
    }

}

export default MiniBlockchainBlock