const CryptoJS = (require ('cryptojs')).Crypto;
const bs58 = require('bs58')
import {WebDollarCrypt} from './../../crypt/webdollar-crypt';
const secp256k1 = require('secp256k1');

// tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
// full demo https://bstavroulakis.com/demos/billcoin/address.php

import {PRIVATE_KEY_USE_BASE64, PRIVATE_KEY_VERSION_PREFIX, PRIVATE_KEY_CHECK_SUM_LENGTH} from './../../../../consts/const_global';

class InterfaceBlockchainAddress{


    constructor (){

    }

    static _generatePrivateKeyAdvanced(salt, showDebug){

        //some Bitcoin and Crypto methods don't like Uint8Array for input. They expect regular JS arrays.
        let privateKeyBytes = WebDollarCrypt.getByteRandomValues(32);

        //if you want to follow the step-by-step results in this article, comment the
        //previous code and uncomment the following
        //var privateKeyBytes = Crypto.util.hexToBytes("1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD")

        //hex string of our private key
        let privateKeyHex = CryptoJS.util.bytesToHex(privateKeyBytes).toUpperCase()

        if (showDebug)
            console.log("privateKeyHex", privateKeyHex) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD



        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes
        let privateKeyAndVersion = PRIVATE_KEY_VERSION_PREFIX + privateKeyHex
        let checksum = InterfaceBlockchainAddress.calculateChecksum(privateKeyAndVersion, showDebug);


        //append checksum to end of the private key and version
        let keyWithChecksum = privateKeyAndVersion + checksum;

        if (showDebug)
            console.log("keyWithChecksum", keyWithChecksum, typeof keyWithChecksum) //"801184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD206EC97E"

        let privateKeyWIF = null, privateKey = null;

        if (!PRIVATE_KEY_USE_BASE64)  {
            privateKeyWIF = bs58.encode(CryptoJS.util.hexToBytes(keyWithChecksum));
            privateKey = bs58.encode(CryptoJS.util.hexToBytes(privateKeyHex));
        }
        else {
            privateKeyWIF = WebDollarCrypt.encodeBase64(CryptoJS.util.hexToBytes(keyWithChecksum));
            privateKey = WebDollarCrypt.encodeBase64(CryptoJS.util.hexToBytes(privateKeyHex));
        }

        if (showDebug)
            console.log("privateKeyWIF", privateKeyWIF) //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"



        return {
            privateKeyWIF:{
                "string": privateKeyWIF,
                "hex": keyWithChecksum,
            },

            privateKey:{
                "string": privateKey,
                "hex": privateKeyHex,
            }

        };
    }

    static _generatePrivateKey(salt, showDebug){
        return InterfaceBlockchainAddress._generatePrivateKeyAdvanced(salt, showDebug).privateKeyWIF.string;
    }

    static _generatePublicKey(privateKey, showDebug){

        // Tutorial based on https://github.com/cryptocoinjs/secp256k1-node



        if (showDebug)
            console.log("privateKey", privateKey, typeof privateKey);



        console.log("secp256k1.privateKeyVerify", secp256k1.privateKeyVerify(privateKey));

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKey);

        console.log("pubKey", pubKey);

        return pubKey;

        // sign the message
        // const sigObj = secp256k1.sign(msg, privKey)

        let msg = new Buffer( WebDollarCrypt.getByteRandomValues(32) );

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey)

        // verify the signature
        if (showDebug)
            console.log("secp256k1.verify", secp256k1.verify(msg, sigObj.signature, pubKey))

    }

    static verifySignedData(signature, pubKey){

    }

    static signMessage(msg, privateKey){
        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey)
    }


    static generateAddress(salt){


        let privateKey = InterfaceBlockchainAddress._generatePrivateKeyAdvanced(salt, true);
        InterfaceBlockchainAddress._generatePublicKey(privateKey.privateKey.hex, true);

    }

    static validateAddress(address){

    }

    static calculateChecksum(privateKeyAndVersion, showDebug){
        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes
        let firstSHA = CryptoJS.SHA256(CryptoJS.util.hexToBytes(privateKeyAndVersion))
        let secondSHA = CryptoJS.SHA256(CryptoJS.util.hexToBytes(firstSHA))
        let checksum = secondSHA.substr(0, PRIVATE_KEY_CHECK_SUM_LENGTH).toUpperCase()

        if (showDebug)
            console.log("checksum", checksum) //"206EC97E"
        return checksum;
    }

    static validatePrivateKey(privateKey){

        if (typeof privateKey === "string") {


            //contains CHECKSUM
            if (privateKey.length === 32 + PRIVATE_KEY_CHECK_SUM_LENGTH) {

                let checkSum = privateKey.substr(privateKey.length - PRIVATE_KEY_CHECK_SUM_LENGTH.length)
                let checksum = InterfaceBlockchainAddress.calculateChecksum(privateKey);

                if (checksum === checkSum) {

                }
            }

            //contains VERSION prefix
            let versionDetected = false;
            if (privateKey.length === 32 + PRIVATE_KEY_VERSION_PREFIX.length ){

                if (privateKey.indexOf(PRIVATE_KEY_VERSION_PREFIX) === 0){
                    versionDetected = true;
                    privateKey = privateKey.substr(PRIVATE_KEY_VERSION_PREFIX.length);
                }

            }

            if (!versionDetected) return {result:false, message: "PRIVATE KEY  VERSION PREFIX is not recognized"}

            if (WebDollarCrypt.isHex(privateKey))
                privateKey = new Buffer(privateKey, "hex");
        }
    }


}

exports.InterfaceBlockchainAddress = InterfaceBlockchainAddress;