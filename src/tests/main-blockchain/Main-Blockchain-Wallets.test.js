var assert = require('assert')

import Blockchain from 'main-blockchain/Blockchain';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'


describe('test save wallet to local storage', () => {


    let response = null;
    
    it('save/load/remove/load wallet to/from local storage, sample test', async () => {
        let blockchainAddress = Blockchain.Wallets.createNewAddress();
        let address = blockchainAddress.address;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey;

        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.load();
        assert(response === true, 'load: ' + response);
        
        assert(blockchainAddress.address.equals(address), 'address differ after load: ' + blockchainAddress.address.toString('hex') + '!==' + address.toString('hex'));
        assert(blockchainAddress.publicKey.equals(publicKey), 'publicKey differ after load: ' + blockchainAddress.publicKey.toString('hex') + '!==' + publicKey.toString('hex'));
        assert(blockchainAddress.address.equals(address), 'privateKey differ after load: ' + blockchainAddress.privateKey.toString('hex') + '!==' + privateKey.toString('hex'));
        
        response = await blockchainAddress.remove();
        assert(response === true, 'remove: ' + response);
        
        response = await blockchainAddress.load();
        assert(response !== true, 'load: ' + response);
        
    });
    
    it('save/save/remove/load/remove/load wallet to/from local storage, sample test', async () => {
        let blockchainAddress = Blockchain.Wallets.createNewAddress();
        let address = blockchainAddress.address;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey;

        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.remove();
        assert(response === true, 'remove: ' + response);
        
        response = await blockchainAddress.load();
        assert(response !== true, 'load: ' + response);
        
    });
    

});
