var assert = require('assert')

import Blockchain from 'main-blockchain/Blockchain';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'


describe('test save wallet to local storage', () => {


    let response = null;
    
    it('save/load/remove/load wallet to/from local storage, sample test', async () => {

        let blockchainAddress = Blockchain.Wallets.createNewAddress();
        let address = blockchainAddress.address;
        let unencodedAddress = blockchainAddress.unencodedAddress;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey.privateKey;

        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.load();
        assert(response === true, 'load: ' + response);
        
        assert(blockchainAddress.address === address, 'address differ after load: ' + blockchainAddress.address + '!==' + address);
        assert(blockchainAddress.unencodedAddress.equals(unencodedAddress), 'unencodedAddress differ after load: ' + blockchainAddress.unencodedAddress.toString('hex') + '!==' + address.toString('hex'));
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
        let unencodedAddress = blockchainAddress.unencodedAddress;
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
        let unencodedAddress = blockchainAddress.unencodedAddress;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey.privateKey;
        let password = 'password';
        
        blockchainAddress.encrypt(password);
        
        response = await blockchainAddress.save();
        assert(response === true, 'save: ' + response);
        
        response = await blockchainAddress.load();
        assert(response === true, 'load: ' + response);
        
        blockchainAddress.decrypt(password);
        assert(blockchainAddress.address === address, 'address differ after load: ' + blockchainAddress.address + '!==' + address);
        assert(blockchainAddress.unencodedAddress.equals(unencodedAddress), 'address differ after load: ' + blockchainAddress.unencodedAddress.toString('hex') + '!==' + unencodedAddress.toString('hex'));
        assert(blockchainAddress.publicKey.equals(publicKey), 'publicKey differ after load: ' + blockchainAddress.publicKey.toString('hex') + '!==' + publicKey.toString('hex'));
        assert(blockchainAddress.privateKey.privateKey.equals(privateKey), 'privateKey differ after load: ' + blockchainAddress.privateKey.privateKey.toString('hex') + '!==' + privateKey.toString('hex'));

        response = await blockchainAddress.remove();
        assert(response === true, 'remove: ' + response);
        
        response = await blockchainAddress.load();
        assert(response !== true, 'load: ' + response);

    });
    
        
    it('load/store wallet manager', async () => {

        assert(typeof Blockchain.Wallets.addresses !== 'undefined', 'Default wallet is not created');

    });
    
  /*  it('update wallet password', async () => {

        let blockchainAddress = Blockchain.Wallets.addresses[0];
        let address = blockchainAddress.address;
        let unencodedAddress = blockchainAddress.unencodedAddress;
        let publicKey = blockchainAddress.publicKey;
        let privateKey = blockchainAddress.privateKey.privateKey;
        
        Blockchain.Wallets.updatePassword('new_pawwsord');
        
        let blockchainAddress2 = Blockchain.Wallets.addresses[0];
        
        assert(blockchainAddress2.address === address, 'address differ after load: ' + blockchainAddress2.address + '!==' + address);
        assert(blockchainAddress2.unencodedAddress.equals(unencodedAddress), 'address differ after load: ' + blockchainAddress2.unencodedAddress.toString('hex') + '!==' + unencodedAddress.toString('hex'));
        assert(blockchainAddress2.publicKey.equals(publicKey), 'publicKey differ after load: ' + blockchainAddress2.publicKey.toString('hex') + '!==' + publicKey.toString('hex'));
        assert(blockchainAddress2.privateKey.privateKey.equals(privateKey), 'privateKey differ after load: ' + blockchainAddress2.privateKey.privateKey.toString('hex') + '!==' + privateKey.toString('hex'));

    });*/

});
