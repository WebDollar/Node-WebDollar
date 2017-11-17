const CryptoJS = (require ('cryptojs')).Crypto;
const bs58 = require('bs58')
import {WebDollarCrypt} from './../../crypt/webdollar-crypt';
const secp256k1 = require('secp256k1');

// tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
// full demo https://bstavroulakis.com/demos/billcoin/address.php

const useBase64 = false;

class InterfaceBlockchainAddress{


    constructor (){

    }

    static _getPrivateKeyAdvanced(salt, showDebug){

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
        let privateKeyAndVersion = "80" + privateKeyHex
        let firstSHA = CryptoJS.SHA256(CryptoJS.util.hexToBytes(privateKeyAndVersion))
        let secondSHA = CryptoJS.SHA256(CryptoJS.util.hexToBytes(firstSHA))
        let checksum = secondSHA.substr(0, 8).toUpperCase()
        console.log(checksum) //"206EC97E"

        //append checksum to end of the private key and version
        let keyWithChecksum = privateKeyAndVersion + checksum;

        if (showDebug)
            console.log("keyWithChecksum", keyWithChecksum, typeof keyWithChecksum) //"801184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD206EC97E"

        let privateKeyWIF = null, privateKey = null;

        if (!useBase64)  {
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
                "string": privateKeyHex,
                "hex": privateKeyHex,
            }

        };
    }

    static _getPrivateKey(salt, showDebug){
        return InterfaceBlockchainAddress._getPrivateKeyAdvanced(salt, showDebug).privateKeyWIF.string;
    }

    static getPublicKey(privateKey, privateKeyType, showDebug){

        // Tutorial based on https://github.com/cryptocoinjs/secp256k1-node

        if (privateKeyType === 'hex' && typeof privateKey === "string")
            privateKey = new Buffer(privateKey, "hex");

        if (showDebug)
            console.log("privateKey", privateKey, typeof privateKey);



        console.log("secp256k1.privateKeyVerify", secp256k1.privateKeyVerify(privateKey));

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKey);

        console.log("pubKey", pubKey);

        // sign the message
        // const sigObj = secp256k1.sign(msg, privKey)

        let msg = new Buffer( WebDollarCrypt.getByteRandomValues(32) );

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey)

        // verify the signature
        console.log("secp256k1.verify", secp256k1.verify(msg, sigObj.signature, pubKey))

        /* output:
        04d0988bfa799f7d7ef9ab3de97ef481cd0f75d2367ad456607647edde665d6f6
        fbdd594388756a7beaf73b4822bc22d36e9bda7db82df2b8b623673eefc0b7495
        */

//
//         const { randomBytes } = require('crypto')
//         const secp256k1 = require('secp256k1')
//         // generate message to sign
//         const msg = randomBytes(32)
//
// // generate privKey
//         let privKey
//         do {
//             privKey = randomBytes(32)
//
//             console.log("nu a mers!!!");
//         } while (!secp256k1.privateKeyVerify(privKey))
//
//         console.log("privKey", privKey, typeof privKey);
//
// // get the public key in a compressed format
//         const pubKey = secp256k1.publicKeyCreate(privKey)
//
//         console.log("public key", pubKey, typeof  pubKey)
//
// // sign the message
//         const sigObj = secp256k1.sign(msg, privKey)
//
// // verify the signature
//         console.log(secp256k1.verify(msg, sigObj.signature, pubKey))
// // => true
    }




    static generateAddress(salt){


        let privateKey = InterfaceBlockchainAddress._getPrivateKeyAdvanced(salt, true);
        InterfaceBlockchainAddress.getPublicKey(privateKey.privateKey.hex, "hex", true);

    }

    static validateAddress(address){

    }



}

exports.InterfaceBlockchainAddress = InterfaceBlockchainAddress;