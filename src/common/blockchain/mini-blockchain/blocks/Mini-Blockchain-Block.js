import consts from 'consts/const_global'

import InterfaceBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import PPoWBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'

let inheritBlockchainBlock;

if (consts.POPOW_PARAMS.ACTIVATED) inheritBlockchainBlock = PPoWBlock;
else  inheritBlockchainBlock = InterfaceBlock;


class MiniBlockchainBlock extends inheritBlockchainBlock {

    getBlockHeader(){

        let json = inheritBlockchainBlock.prototype.getBlockHeader.call(this);

        json.data.hashAccountantTree = this.data.hashAccountantTree;

        return json;
    }

    importBlockFromHeader(json){

        this.data.hashAccountantTree = json.data.hashAccountantTree;

        inheritBlockchainBlock.prototype.importBlockFromHeader.call(json);
    }

}

export default MiniBlockchainBlock