import InterfaceBlockchainProtocol from 'common/blockchain/interface-blockchain/blockchain-protocol/Interface-Blockchain-Protocol'

class MiniBlockchainProtocol extends InterfaceBlockchainProtocol{

    _validateBlockchainHeader(data){

        InterfaceBlockchainProtocol.prototype._validateBlockchainHeader.call(this, data);

        if ((typeof data.header.data.hashAccountantTree === 'string' || Buffer.isBuffer(data.header.data.hashAccountantTree)) === false) throw 'hashAccountantTree is not specified';

    }

}

export default MiniBlockchainProtocol