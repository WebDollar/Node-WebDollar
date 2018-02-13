import WebDollarCrypto from "common/crypto/WebDollar-Crypto";

let assert = require('assert');

import MultiSig from 'common/blockchain/interface-blockchain/addresses/MultiSig';
import Blockchain from 'main-blockchain/Blockchain';
import BufferExtended from "../../common/utils/BufferExtended";

describe('test save addresses to local storage', () => {

    let response = null;

    it('test check multiSig encrypt/decrypt Buffer sample test', () => {

        let buffer = WebDollarCrypto.getBufferRandomValues(32);
        let encrypt = MultiSig.getMultiAESEncrypt(buffer, ["ana", "are", "mere", "rosii"]);
        let decrypt = MultiSig.getMultiAESDecrypt(encrypt, ["ana", "are", "mere", "rosii"]);

        assert(decrypt.equals(buffer), "Buffer differ after multiAESDecrypt" + buffer.toString("hex") + "!==" + decrypt.toString("hex"));
    });

    it('test check multiSig encrypt/decrypt Buffer test 2', () => {

        let buffer = WebDollarCrypto.getBufferRandomValues(32);
        let encrypt = MultiSig.getMultiAESEncrypt(buffer, ["ana", "are", "mere", "rosii"]);
        let decrypt = MultiSig.getMultiAESDecrypt(encrypt, ["anaare", "mererosii"]);

        assert(decrypt === null || !decrypt.equals(buffer), "Buffer should differ after multiAESDecrypt");

        encrypt = MultiSig.getMultiAESEncrypt(buffer, ["ana", "are", "mere", "rosii"]);
        decrypt = MultiSig.getMultiAESDecrypt(encrypt, ["anaaremererosii"]);
        assert(decrypt === null || !decrypt.equals(buffer), "Buffer should differ after multiAESDecrypt");
    });

    it('test check function isPrivateKeyEncrypted', async () => {

        let blockchainAddress = await Blockchain.Wallet.createNewAddress();
        let response = await blockchainAddress.isPrivateKeyEncrypted();

        assert(response === false, "isPrivateKeyEncrypted doesn't work");
    });

    it('test BufferExtended.fromBase', async () => {

        let address = "WEBD$gCV7BpnRcygsUyJZEyKK95cEG1keYcSwk2HAsm9pFbAqpiLhUjsPw==";
        let unecodedAddress = BufferExtended.fromBase(address);

        assert(unecodedAddress !== undefined, "Error BufferExtended.fromBase");
        assert(Buffer.isBuffer(unecodedAddress), "BufferExtended.fromBase(address) should create buffer");
    });
    
    it('test check multiSig encrypt/decrypt privateKey with 12 words', async () => {
        
        let passwordZero = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i','j', 'k', 'l'];
        let blockchainAddress = await Blockchain.Wallet.createNewAddress();
        let privateKey0 = await blockchainAddress.getPrivateKey();
        
        let encrypt = MultiSig.getMultiAESEncrypt(privateKey0, passwordZero);
        let privateKey1 = MultiSig.getMultiAESDecrypt(encrypt, passwordZero);
        
        assert(privateKey1.equals(privateKey0), "privateKey differ after decrypt" + privateKey0.toString("hex") + "!==" + privateKey1.toString("hex"));
        
    });

    it('test check save/get privateKey encrypted with 12 words', async () => {

        let passwordZero = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i','j', 'k', 'l'];
        let passwordOne = ['ak', 'bv', 'co', 'dy', 're', 'ff', 'sg', 'rh', 'ti','sj', 'ck', 'ul'];
        let blockchainAddress = await Blockchain.Wallet.createNewAddress();

        let privateKey0 = await blockchainAddress.getPrivateKey();
        assert(privateKey0 !== null, "Address should not be null");

        response = await blockchainAddress.savePrivateKey(privateKey0, passwordZero);
        assert(response === true, "Error saving privateKey: " + response);

        let privateKey1 = await blockchainAddress.getPrivateKey(passwordZero);
        assert(privateKey0.equals(privateKey1), "Address differ after decrypt: " + privateKey0.toString("hex") + "!==" + privateKey1.toString("hex"));

        response = await blockchainAddress.savePrivateKey(privateKey0, passwordOne);
        assert(response === true, "Error saving privateKey: " + response);

        privateKey0 = await blockchainAddress.getPrivateKey(passwordOne);
        assert(privateKey0.equals(privateKey1), "Address differ after decrypt: " + privateKey0.toString("hex") + "!==" + privateKey1.toString("hex"));
    });


});
