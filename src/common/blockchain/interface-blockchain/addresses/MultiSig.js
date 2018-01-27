/*
 * Copyright (c) Silviu Stroe 2018.
*/
const BitcoinJS = require('bitcoinjs-lib');
var Bigi = require('bigi');
var Crypto = require('crypto');
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto';
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

class MultiSig {

    /**  users public Keys which are used in generating a multi sig address
     *
     *
     * @param publicKeys
     * @returns {*}
     *
     * Example:
     *
     let pubKeys = [
     '026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01',
     '02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9',
     '03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9'
     ];
     let address = InterfaceBlockchainAddressHelper2.generateAddress(pubKeys);
     */
    static generateAddress(publicKeys, numKeysRequired=2) {

        let pubKeys = publicKeys.map(function (hex) {
            return Buffer.from(hex, 'hex')
        });

        let redeemScript = BitcoinJS.script.multisig.output.encode(numKeysRequired, pubKeys); // 2 of 3
        let scriptPubKey = BitcoinJS.script.scriptHash.output.encode(BitcoinJS.crypto.hash160(redeemScript));
        let address = BitcoinJS.address.fromOutputScript(scriptPubKey);

        return address;
    }

    static multisigPrivateKey(privateKey){
        return privateKey;
    }

    /**
     * create (and broadcast via 3PBP) a Transaction with a 2-of-4 P2SH(multisig) input
     * https://github.com/BitcoinJSjs/BitcoinJSjs-lib/blob/e0f24fdd46e11533a7140e02dc43b04a4cc4522e/test/integration/transactions.js#L115
     */
    createTransaction(numKeysRequired) {

        let keyPairs = [
            '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgwmaKkrx', //public keys not public addresses
            '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgww7vXtT',
            '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgx3cTMqe',
            '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgx9rcrL7'
        ].map(function (wif) {
            return BitcoinJS.ECPair.fromWIF(wif, testnet)
        });
        let pubKeys = keyPairs.map(function (x) {
            return x.getPublicKeyBuffer()
        });

        let redeemScript = BitcoinJS.script.multisig.output.encode(numKeysRequired, pubKeys)
        let scriptPubKey = BitcoinJS.script.scriptHash.output.encode(BitcoinJS.crypto.hash160(redeemScript))
        let address = BitcoinJS.address.fromOutputScript(scriptPubKey, testnet)

        testnetUtils.faucet(address, 2e4, function (err, unspent) {
            if (err) return done(err)

            let txb = new BitcoinJS.TransactionBuilder(testnet)
            txb.addInput(unspent.txId, unspent.vout)
            txb.addOutput(testnetUtils.RETURN_ADDRESS, 1e4)

            txb.sign(0, keyPairs[0], redeemScript)
            txb.sign(0, keyPairs[2], redeemScript)

            let tx = txb.build()

            // build and broadcast to the BitcoinJS Testnet network
            testnetUtils.transactions.propagate(tx.toHex(), function (err) {
                if (err) return done(err)

                testnetUtils.verify(address, tx.getId(), 1e4, done)
            })
        })
    }




    static createPrivateKey(dates){

        let concatDates = "";

        for (let i = 0; i <= dates.length; ++i){

            concatDates += dates[i];
        }

        return WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(concatDates));

    }

    static getPublicKeyFromPrivate(privateKey){

        return  InterfaceBlockchainAddressHelper._generatePublicKey(privateKey);
    }

    static signMessage(msg, privateKey){

        return  InterfaceBlockchainAddressHelper.signMessage(msg, privateKey);
    }

    static validateSignedMessage(msg, signature, publicKey) {

        return InterfaceBlockchainAddressHelper.verifySignedData(msg, signature, publicKey);
    }

    //
    // /**
    //  * the demo generates 3 users' private keys => 3 users public Keys which are used in generating a multi sig address
    //  *
    //  * each users privateKey is mapped with multisig address to return the multisig privateKey attached to the user privateKey
    //  *
    //  * @returns {{}}
    //  */
    // makeMultisigAddress() {
    //
    //     var privKeys = [ BitcoinJS.ECKey.makeRandom(),
    //         BitcoinJS.ECKey.makeRandom(),
    //         BitcoinJS.ECKey.makeRandom() ];
    //
    //     var pubKeys = privKeys.map(function(x) { return x.pub });
    //
    //     var redeemScript = BitcoinJS.scripts.multisigOutput(2, pubKeys);
    //     var scriptPubKey = BitcoinJS.scripts.scriptHashOutput(redeemScript.getHash());
    //     var address = BitcoinJS.Address.fromOutputScript(scriptPubKey).toString();
    //
    //     var o = {};
    //     o.address = address;
    //     o.redeemScript = redeemScript.toHex();
    //     o.privateKeys = privKeys.map(function(x) { return x.toWIF() });
    //
    //     return o;
    //
    // }



}

export default MultiSig;