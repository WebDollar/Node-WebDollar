/*
 * Copyright (c) Silviu Stroe 2018.
*/
const bitcoin = require('bitcoinjs-lib');

class InterfaceBlockchainAddressHelper2 {


    static generateAddress(key_no = 3) {


        let privateKeys = [];
        for (let x = 0; x < key_no; x++) {
            privateKeys.push(bitcoin.ECKey.makeRandom())
        }

        let publicKeys = privateKeys.map(function (x) {
            return x.pub
        });


        let redeemScript = bitcoin.scripts.multisigOutput(2, publicKeys);
        let scriptPubKey = bitcoin.scripts.scriptHashOutput(redeemScript.getHash());
        let address = bitcoin.Address.fromOutputScript(scriptPubKey).toString();

        let res = {};
        res.address = address;
        res.redeemScript = redeemScript.toHex();
        res.privateKeys = privateKeys.map(function (x) {
            return x.toWIF()
        });

        return res;
    }

}

export default InterfaceBlockchainAddressHelper2;