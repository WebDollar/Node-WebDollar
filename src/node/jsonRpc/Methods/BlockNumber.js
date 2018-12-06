import {Method} from './../../../jsonRpc'
import Blockchain from '../../../main-blockchain/Blockchain';

class BlockNumber extends Method
{
    getHandler() {
        return Blockchain.blockchain.blocks.last.height;
    }
}

export default BlockNumber;
