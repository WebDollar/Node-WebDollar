import WebDollarCrypto from "common/crypto/WebDollar-Crypto";

let assert = require('assert');

import MultiSig from 'common/blockchain/interface-blockchain/addresses/MultiSig';

describe('test save wallet to local storage', () => {

    let response = null;

    it('test check multiSig encrypt/decrypt Buffer sample test', () => {

        let buffer = WebDollarCrypto.getBufferRandomValues(32);
        let encrypt = MultiSig.getMultiAESEncrypt(buffer, ["ana are mere rosii"]);
        let decrypt = MultiSig.getMultiAESDecrypt(encrypt, ["ana are mere rosii"]);

        assert(decrypt.equals(buffer), "Buffer differ after multiAESDecrypt" + buffer.toString("hex") + "!==" + decrypt.toString("hex"));
    });

    it('test check multiSig encrypt/decrypt Buffer test 2', () => {

        let buffer = WebDollarCrypto.getBufferRandomValues(32);
        let encrypt = MultiSig.getMultiAESEncrypt(buffer, ["ana are mere rosii"]);
        let decrypt = MultiSig.getMultiAESDecrypt(encrypt, ["anaare mererosii"]);

        assert(decrypt === null || !decrypt.equals(buffer), "Buffer should differ after multiAESDecrypt");

        encrypt = MultiSig.getMultiAESEncrypt(buffer, ["ana are mere rosii"]);
        decrypt = MultiSig.getMultiAESDecrypt(encrypt, ["anaaremererosii"]);
        assert(decrypt === null || !decrypt.equals(buffer), "Buffer should differ after multiAESDecrypt");
    });

});
