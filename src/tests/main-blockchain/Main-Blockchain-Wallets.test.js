var assert = require('assert')

import Blockchain from 'main-blockchain/Blockchain';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'


describe('test save wallet to local storage', () => {


    let response = null;
    
    it('save/load/remove/load wallet to/from local storage, sample test', async () => {

        let blockchainAddress = Blockchain.Wallets.createNewAddress();
        let address = blockchainAddress.address;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey.privateKey;

        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.load();
        assert(response === true, 'load: ' + response);
        
        assert(blockchainAddress.address.equals(address), 'address differ after load: ' + blockchainAddress.address.toString('hex') + '!==' + address.toString('hex'));
        assert(blockchainAddress.publicKey.equals(publicKey), 'publicKey differ after load: ' + blockchainAddress.publicKey.toString('hex') + '!==' + publicKey.toString('hex'));
        assert(blockchainAddress.privateKey.privateKey.equals(privateKey), 'privateKey differ after load: ' + blockchainAddress.privateKey.privateKey.toString('hex') + '!==' + privateKey.toString('hex'));
        
        response = await blockchainAddress.remove();
        assert(response === true, 'remove: ' + response);
        
        response = await blockchainAddress.load();
        assert(response !== true, 'load: ' + response);
        
    });
    
    it('save/save/remove/load/ wallet to/from local storage, sample test', async () => {

        let blockchainAddress = Blockchain.Wallets.createNewAddress();
        let address = blockchainAddress.address;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey.privateKey;

        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.remove();
        assert(response === true, 'remove: ' + response);
        
        response = await blockchainAddress.load();
        assert(response !== true, 'load: ' + response);

    });
    
    
    it('test save/load/remove/load with AES encrypt/decrypt privateKey', async () => {

        let blockchainAddress = Blockchain.Wallets.createNewAddress();
        let address = blockchainAddress.address;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey.privateKey;
        let password = 'password';
        
        blockchainAddress.encrypt(password);
        
        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.load();
        assert(response === true, 'load: ' + response);
        
        blockchainAddress.decrypt(password);
        assert(blockchainAddress.address.equals(address), 'address differ after load: ' + blockchainAddress.address.toString('hex') + '!==' + address.toString('hex'));
        assert(blockchainAddress.publicKey.equals(publicKey), 'publicKey differ after load: ' + blockchainAddress.publicKey.toString('hex') + '!==' + publicKey.toString('hex'));
        assert(blockchainAddress.privateKey.privateKey.equals(privateKey), 'privateKey differ after load: ' + blockchainAddress.privateKey.privateKey.toString('hex') + '!==' + privateKey.toString('hex'));

        response = await blockchainAddress.remove();
        assert(response === true, 'remove: ' + response);
        
        response = await blockchainAddress.load();
        assert(response !== true, 'load: ' + response);

    });
    
        
    it('check if the wallet is created/loaded in MainBlockchainWallets constructor', async () => {

        assert(typeof Blockchain.Wallets.blockchainAddress !== 'undefined', 'Default wallet is not created');

    });

});
