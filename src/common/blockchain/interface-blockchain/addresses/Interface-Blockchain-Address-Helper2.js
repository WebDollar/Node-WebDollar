/*
 * Copyright (c) Silviu Stroe 2018.
*/
const bitcoin = require('bitcoinjs-lib');

class InterfaceBlockchainAddressHelper2 {

    /**
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
    static generateAddress(publicKeys) {

        let pubKeys = publicKeys.map(function (hex) {
            return Buffer.from(hex, 'hex')
        });

        let redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
        let scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
        let address = bitcoin.address.fromOutputScript(scriptPubKey);


        return address;
    }

}

module.exports = InterfaceBlockchainAddressHelper2;