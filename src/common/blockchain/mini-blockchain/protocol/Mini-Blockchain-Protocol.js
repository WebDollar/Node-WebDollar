import InterfaceBlockchainProtocol from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol'
import Serialization from 'common/utils/Serialization'

/**
 * MiniBlockchainProtocol only extends the initial Protocol in order to validate the hashAccountantTree
 */

class MiniBlockchainProtocol extends InterfaceBlockchainProtocol{

    _validateBlockchainHeader(data){

        InterfaceBlockchainProtocol.prototype._validateBlockchainHeader.call(this, data);

        if (typeof data.header.data.hashAccountantTree === 'string') data.header.data.hashAccountantTree = Serialization.fromBase(data.header.data.hashAccountantTree);
        else data.header.data.hashAccountantTree = new Buffer(data.header.data.hashAccountantTree);

    }

}

export default MiniBlockchainProtocol