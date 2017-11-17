const CryptoJS = (require ('cryptojs')).Crypto;
import {WebDollarCryptData} from './../../crypt/webdollar-crypt-data';
const secp256k1 = require('secp256k1');
import {WebDollarCrypt} from './../../crypt/webdollar-crypt';
// tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
// full demo https://bstavroulakis.com/demos/billcoin/address.php

import {PRIVATE_KEY_VERSION_PREFIX, PRIVATE_KEY_CHECK_SUM_LENGTH} from './../../../../consts/const_global';

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

        let privateKeyWIF = new WebDollarCryptData(keyWithChecksum, "hex");
        let privateKey = new WebDollarCryptData(privateKeyHex, "hex");


        if (showDebug) {
            console.log("privateKeyWIF", privateKeyWIF, "length", privateKeyWIF.buffer.length) //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"
            console.log("privateKey", privateKey, "length", privateKey.buffer.length) //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"
        }



        return {
            privateKeyWIF: privateKeyWIF,
            privateKey: privateKey,
        };
    }

    static _generatePrivateKey(salt, showDebug){
        return InterfaceBlockchainAddress._generatePrivateKeyAdvanced(salt, showDebug).privateKeyWIF.string;
    }

    static _generatePublicKey(privateKey, showDebug){

        // Tutorial based on https://github.com/cryptocoinjs/secp256k1-node

        if (typeof privateKey !== 'object' || privateKey.constructor.name !== 'WebDollarCryptData' ){
            console.log("ERROR! ",  privateKey, " is not a WebDollarCryptData")
            throw 'privateKey must be a WebDollarCryptData';
        }

        let validation = InterfaceBlockchainAddress.validatePrivateKey(privateKey);
        console.log("VALIDATIOn", validation)
        if (validation.result === false){
            return validation;
        } else{
            privateKey = validation.privateKey;
        }

        if (showDebug)
            console.log("privateKey", privateKey, typeof privateKey);

        console.log("secp256k1.privateKeyVerify", secp256k1.privateKeyVerify(privateKey.buffer));

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKey.buffer);

        console.log("pubKey", pubKey);

        return pubKey;

        // sign the message

        let msg = new Buffer( WebDollarCrypt.getByteRandomValues(32) );

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey.buffer)

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
        InterfaceBlockchainAddress._generatePublicKey(privateKey.privateKey, true);

    }

    static validateAddress(address){

    }

    static calculateChecksum(privateKeyAndVersionHex, showDebug){

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes
        let firstSHA = CryptoJS.SHA256(CryptoJS.util.hexToBytes(privateKeyAndVersionHex))
        let secondSHA = CryptoJS.SHA256(CryptoJS.util.hexToBytes(firstSHA))
        let checksum = secondSHA.substr(0, PRIVATE_KEY_CHECK_SUM_LENGTH).toUpperCase()

        if (showDebug)
            console.log("checksum", checksum) //"206EC97E"
        return checksum;
    }

    /*
        it returns the validity of PrivateKey

        and in case privateKey is a WIF, it returns the private key without WIF
     */
    static validatePrivateKey(privateKey){

        if (typeof privateKey !== 'object' || privateKey.constructor.name !== 'WebDollarCryptData' ){
            throw ('privateKey must be a WebDollarCryptData');
        }

        //contains VERSION prefix
        let versionDetected = false;
        let versionDetectedBuffer = '';

        if (privateKey.buffer.length > 32 + PRIVATE_KEY_VERSION_PREFIX.length ){

            //console.log("Buffer.IndexOf", privateKey.buffer.indexOf( Buffer.from(PRIVATE_KEY_VERSION_PREFIX, "hex") ))

            if (privateKey.buffer.indexOf( Buffer.from(PRIVATE_KEY_VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = privateKey.substr(0, PRIVATE_KEY_VERSION_PREFIX.length/2);
                privateKey = privateKey.substr(PRIVATE_KEY_VERSION_PREFIX.length/2);
            }

        }

        console.log("versionDetected", versionDetected, versionDetectedBuffer, privateKey);

        //contains CHECKSUM
        let checkSumDetected = false;

        if (privateKey.buffer.length === 32 + PRIVATE_KEY_CHECK_SUM_LENGTH / 2) {

            console.log(privateKey, privateKey.buffer.length, 32 + PRIVATE_KEY_CHECK_SUM_LENGTH / 2);
            let privateKeyCheckSum = privateKey.substr(privateKey.buffer.length - PRIVATE_KEY_CHECK_SUM_LENGTH /2)

            let privateKeyJustVersionHex = versionDetectedBuffer.toHex() + privateKey.substr(0, privateKey.buffer.length - PRIVATE_KEY_CHECK_SUM_LENGTH /2).toHex();
            let checksum = InterfaceBlockchainAddress.calculateChecksum(privateKeyJustVersionHex);

            //console.log("checkSum", privateKeyCheckSum, "privateKeyJustVersionHex", privateKeyJustVersionHex);
            //console.log("checkSum2", checksum);

            if (checksum.toUpperCase() === privateKeyCheckSum.toHex().toUpperCase()) {
                checkSumDetected = true;

                privateKey = privateKey.substr(0, privateKey.buffer.length - PRIVATE_KEY_CHECK_SUM_LENGTH/2)
            }
        }


        if (privateKey.buffer.length !== 32){

            if (!checkSumDetected)
                return {result:false, message: "PRIVATE KEY  CHECK SUM is not right"};

            if (!versionDetected)
                return {result:false, message: "PRIVATE KEY  VERSION PREFIX is not recognized"}
        }
        return {result: true, privateKey: privateKey};

    }


}

exports.InterfaceBlockchainAddress = InterfaceBlockchainAddress;