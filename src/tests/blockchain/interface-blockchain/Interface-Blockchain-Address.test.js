
var assert = require('assert')


import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import consts from 'consts/const_global'


describe('testAddressGenerator', () => {

    it('generate public addresses', ()=>{

        for (let i=0; i<3; i++) {


            let address = InterfaceBlockchainAddressHelper.generateAddress();

            console.log("address", address.address);
            console.log("unencodedAddress",address.unencodedAddress.toString("hex"));
            console.log("publicKey", address.publicKey.toString("hex"));
            console.log("privateKey", address.privateKey.privateKeyWIF.toString("hex"));
            console.log("    ");
            console.log("    ");

        }

        consts.ADDRESSES.ADDRESS.USE_BASE64 = !consts.ADDRESSES.ADDRESS.USE_BASE64;

        for (let i=0; i<2; i++) {


            let address = InterfaceBlockchainAddressHelper.generateAddress();

            console.log("address", address.address);
            console.log("unencodedAddress",address.unencodedAddress.toString("hex"));
            console.log("publicKey", address.publicKey.toString("hex"));
            console.log("privateKey", address.privateKey.privateKeyWIF.toString("hex"));
            console.log("    ");
            console.log("    ");

        }

        consts.ADDRESSES.ADDRESS.USE_BASE64 = !consts.ADDRESSES.ADDRESS.USE_BASE64;

    });

    let privateKey  = null;
    it('should return privateKey', ()=>{
        privateKey =  InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced("123", true);

        assert (privateKey.privateKeyWIF, "privateKeyWIF doesn't exist");
        assert (privateKey.privateKey, "privateKey doesn't exist");

        assert(Buffer.isBuffer(privateKey.privateKey), 'Private Key privateKey is not an object');
        assert(Buffer.isBuffer(privateKey.privateKeyWIF), 'Private Key privateKeyWIF is not an object');
    });

    let publicKey  = null;
    it('should return publicKey', ()=>{

        publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, true);

        assert(Buffer.isBuffer(publicKey), 'Public Key is not an object');
    });

    let address = null;
    it ('should return address', ()=>{
        address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, true);

        console.log("should return address", address);
        assert(Buffer.isBuffer(address.unencodedAddress), 'Address is not an object');
        assert(typeof address.address === "string", 'Address is not an object');
    });

    it ('blockchain address', async ()=>{

        let blockchainAddress = new InterfaceBlockchainAddress();
        console.log("new address1");
        await blockchainAddress.createNewAddress();

        console.log("new address", blockchainAddress.address, blockchainAddress.privateKey, blockchainAddress.publicKey);

        assert(typeof blockchainAddress.address === "string", "blockChain Address");
        assert(Buffer.isBuffer(blockchainAddress.unencodedAddress), "blockChain Address");
        assert(Buffer.isBuffer(blockchainAddress.publicKey), "blockChain Public Key");
        
        let privateKey = await blockchainAddress.getPrivateKey();
        assert(Buffer.isBuffer(privateKey), "blockChain Private Key");

        let stringDebug = await blockchainAddress._toStringDebug();
        let string = blockchainAddress.toString();

        assert(typeof stringDebug === 'string', "Addresses Debug String returned is not string");
        assert(typeof string === 'string', "Addresses String returned is not string");

    });


});

