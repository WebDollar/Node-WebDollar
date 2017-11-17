const CryptoJS = (require ('cryptojs')).Crypto;
const bs58 = require('bs58')
const BigInteger = require('big-integer').BigInteger;
import {getSECCurveByName} from '../../crypt/eliptic-curves/bitcoin-elliptic-curve';
import {WebDollarCrypt} from './../../crypt/webdollar-crypt';

// tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
// full demo https://bstavroulakis.com/demos/billcoin/address.php

const useBase64 = false;

class InterfaceBlockchainAddress{


    constructor (){

    }

    static getPrivateKeyAdvanced(salt, showDebug){

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

        let privateKeyWIF = null;

        if (!useBase64)  privateKeyWIF = bs58.encode(CryptoJS.util.hexToBytes(keyWithChecksum));
        else privateKeyWIF = WebDollarCrypt.encodeBase64(CryptoJS.util.hexToBytes(keyWithChecksum));

        if (showDebug)
            console.log("privateKeyWIF", privateKeyWIF) //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"



        return {
            "address": privateKeyWIF,
            "hex": keyWithChecksum,
        };
    }

    static getPrivateKey(salt, showDebug){
        return InterfaceBlockchainAddress.getPrivateKeyAdvanced(salt, showDebug).string;
    }

    static getPublicKey(privateKey, privateKeyType, showDebug){

        // Tutorial based on https://github.com/cryptocoinjs/secp256k1-node

        if (privateKeyType === 'hex' && typeof privateKey === "string")
            privateKey= new Buffer(privateKey, "hex");

        console.log(privateKey, typeof privateKey);

        const secp256k1 = require('secp256k1');

        console.log(secp256k1.privateKeyVerify(privateKey));

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKey);

        console.log("pubKey", pubKey);

        // sign the message
        // const sigObj = secp256k1.sign(msg, privKey)

        let msg = WebDollarCrypt.getByteRandomValues(32);
        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey)

        // verify the signature
        console.log("secp256k1.verify", secp256k1.verify(msg, sigObj.signature, pubKey))

        /* output:
        04d0988bfa799f7d7ef9ab3de97ef481cd0f75d2367ad456607647edde665d6f6
        fbdd594388756a7beaf73b4822bc22d36e9bda7db82df2b8b623673eefc0b7495
        */
    }




    static getPublicKeyOld(inputPrivateKey){


        let curve = getSECCurveByName("secp256k1") //found in bitcoinjs-lib/src/jsbn/sec.js

        //convert our random array or private key to a Big Integer
        let privateKeyBN = BigInteger.fromByteArrayUnsigned(inputPrivateKey)

        //This is using the elliptic curve algorithm. For more info checkout https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm
        //and http://www.certicom.com/index.php/ecc-tutorial
        //and http://blog.cloudflare.com/a-relatively-easy-to-understand-primer-on-elliptic-curve-cryptography
        //The elliptic curve used is y^2=x^3+7.
        let curvePt = curve.getG().multiply(privateKeyBN)
        let x = curvePt.getX().toBigInteger()
        let y = curvePt.getY().toBigInteger()
        let publicKeyBytes = integerToBytes(x,32) //integerToBytes is found in bitcoinjs-lib/src/ecdsa.js
        publicKeyBytes = publicKeyBytes.concat(integerToBytes(y,32))
        publicKeyBytes.unshift(0x04)
        let publicKeyHex = CryptoJS.util.bytesToHex(publicKeyBytes)

        console.log("publicKeyHex", publicKeyHex)
        /* output:
        04d0988bfa799f7d7ef9ab3de97ef481cd0f75d2367ad456607647edde665d6f6
        fbdd594388756a7beaf73b4822bc22d36e9bda7db82df2b8b623673eefc0b7495
        */
    }

    static validateAddress(address){

    }



}

exports.InterfaceBlockchainAddress = InterfaceBlockchainAddress;