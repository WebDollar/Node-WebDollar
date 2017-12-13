import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
const secp256k1 = require('secp256k1');
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
// tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
// full demo https://bstavroulakis.com/demos/billcoin/address.php

//video tutorial https://asecuritysite.com/encryption/base58

import consts from 'consts/const_global'

class InterfaceBlockchainAddressHelper{


    constructor (){

    }

    static _generatePrivateKeyAdvanced(salt, showDebug){

        //tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript

        //some Bitcoin and Crypto methods don't like Uint8Array for input. They expect regular JS arrays.
        let privateKeyBytes = WebDollarCrypto.getByteRandomValues(32);

        //if you want to follow the step-by-step results in this article, comment the
        //previous code and uncomment the following
        //var privateKeyBytes = Crypto.util.hexToBytes("1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD")

        //hex string of our private key
        let privateKeyHex = WebDollarCrypto.bytesToHex(privateKeyBytes).toUpperCase()

        if (showDebug)
            console.log("privateKeyHex", privateKeyHex, "length", privateKeyHex.length) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes
        let privateKeyAndVersion = consts.PRIVATE_KEY_VERSION_PREFIX + privateKeyHex
        let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyAndVersion, showDebug);


        //append checksum to end of the private key and version
        let keyWithChecksum = privateKeyAndVersion + checksum;

        if (showDebug)
            console.log("keyWithChecksum", keyWithChecksum, typeof keyWithChecksum) //"801184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD206EC97E"

        let privateKeyWIF = new WebDollarCryptoData(keyWithChecksum, "hex");
        let privateKey = new WebDollarCryptoData(privateKeyHex, "hex");


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
        return InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced(salt, showDebug).privateKeyWIF.string;
    }

    static _generatePublicKey(privateKey, showDebug){

        // Tutorial based on https://github.com/cryptocoinjs/secp256k1-node

        if (privateKey === null || typeof privateKey !== 'object' || privateKey instanceof WebDollarCryptoData === false ){
            console.log("ERROR! ",  privateKey, " is not a WebDollarCryptoData")
            throw 'privateKey must be a WebDollarCryptoData';
        }

        let validation = InterfaceBlockchainAddressHelper.validatePrivateKey(privateKey);

        if (showDebug)
            console.log("VALIDATIOn", validation)

        if (validation.result === false){
            return validation;
        } else{
            privateKey = validation.privateKey;
        }

        if (showDebug) {
            console.log("privateKey", privateKey, typeof privateKey);
            console.log("secp256k1.privateKeyVerify", secp256k1.privateKeyVerify(privateKey.buffer));
        }

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKey.buffer);

        if (showDebug)
            console.log("pubKey", pubKey);

        return new WebDollarCryptoData(pubKey);

        // sign the message

        let msg = new Buffer( WebDollarCrypto.getByteRandomValues(32) );

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey.buffer)

        // verify the signature
        if (showDebug)
            console.log("secp256k1.verify", secp256k1.verify(msg, sigObj.signature, pubKey))

    }

    static verifySignedData(msg, signature, pubKey){

        if (pubKey === null || typeof pubKey !== 'object' || pubKey.constructor.name !== 'WebDollarCryptoData' ){
            console.log("ERROR! ",  pubKey, " is not a WebDollarCryptoData")
            throw 'privateKey must be a WebDollarCryptoData';
        }

        if (typeof signature.signature !== 'undefined') signature = signature.signature;

        return secp256k1.verify(msg, signature, pubKey.buffer);
    }

    static signMessage(msg, privateKey){

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey);
        return sigObj;
    }

    static _generateAddressFromPublicKey(publicKey, showDebug){

        if (typeof publicKey !== 'object' || publicKey.constructor.name !== 'WebDollarCryptoData' ){
            console.log("ERROR! ",  publicKey, " is not a WebDollarCryptoData")
            throw 'publicKey must be a WebDollarCryptoData';
        }

        //could use publicKeyBytesCompressed as well

        //bitcoin original
        //let hash160 = CryptoJS.RIPEMD160(CryptoJS.util.hexToBytes(CryptoJS.SHA256(publicKey.toBytes())))

        let hash160 =  WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(publicKey.buffer))

        if (showDebug)
            console.log("hash160 hex", hash160.toString('hex') ) //"3c176e659bea0f29a3e9bf7880c112b1b31b4dc8"

        let version = 0x00 //if using testnet, would use 0x6F or 111.
        let hashAndBytes = hash160.toBytes()
        hashAndBytes.unshift(version)

        let doubleSHA = WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(new Buffer(hashAndBytes, "hex") )).toString('hex')
        let addressChecksum = doubleSHA.substr(0,8)

        if (showDebug)
            console.log("addressChecksum", addressChecksum) //26268187


        let unencodedAddress = ( consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_PREFIX_BASE64 : consts.PUBLIC_ADDRESS_PREFIX_BASE58 )
                                 + hash160.toString('hex')
                                 + addressChecksum + (consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_SUFFIX_BASE64 : consts.PUBLIC_ADDRESS_SUFFIX_BASE58);

        // if (showDebug)
        //     console.log("unencodedAddress", unencodedAddress) //003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187

        let address = new WebDollarCryptoData(unencodedAddress, "hex");

        if (showDebug)
            console.log("address",address.toBase()); //16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS

        return  address;

    }

    static generateAddress(salt){

        let privateKey = InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced(salt, false);
        let publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKey, false);
        let address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, false)

        return {
            address: address,
            publicKey: publicKey,
            privateKey: privateKey,
        };

    }

    static validateAddress(address){

    }

    static _calculateChecksum(privateKeyAndVersion, showDebug){

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes

        if (!Buffer.isBuffer(privateKeyAndVersion) && typeof privateKeyAndVersion === 'string')
            privateKeyAndVersion = Buffer.from(privateKeyAndVersion, 'hex');

        let firstSHA = WebDollarCrypto.SHA256(privateKeyAndVersion)
        let secondSHA = WebDollarCrypto.SHA256(firstSHA)
        let checksum = secondSHA.toString('hex').substr(0, consts.PRIVATE_KEY_CHECK_SUM_LENGTH).toUpperCase()

        if (showDebug)
            console.log("checksum", checksum) //"206EC97E"

        return checksum;
    }

    /*
        it returns the validity of PrivateKey

        and in case privateKey is a WIF, it returns the private key without WIF
     */
    static validatePrivateKey(privateKey){

        if (privateKey === null || typeof privateKey !== 'object' || privateKey instanceof WebDollarCryptoData === false ){
            throw ('privateKey must be a WebDollarCryptoData');
        }

        //contains VERSION prefix
        let versionDetected = false;
        let versionDetectedBuffer = '';

        if (privateKey.buffer.length > 32 + consts.PRIVATE_KEY_VERSION_PREFIX.length ){

            //console.log("Buffer.IndexOf", privateKey.buffer.indexOf( Buffer.from(PRIVATE_KEY_VERSION_PREFIX, "hex") ))

            if (privateKey.buffer.indexOf( Buffer.from(consts.PRIVATE_KEY_VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = privateKey.substr(0, consts.PRIVATE_KEY_VERSION_PREFIX.length/2);
                privateKey = privateKey.substr(consts.PRIVATE_KEY_VERSION_PREFIX.length/2);
            }

        }

        //console.log("versionDetected", versionDetected, versionDetectedBuffer, privateKey);

        //contains CHECKSUM
        let checkSumDetected = false;

        if (privateKey.buffer.length === 32 + consts.PRIVATE_KEY_CHECK_SUM_LENGTH / 2) {

            //console.log(privateKey, privateKey.buffer.length, 32 + consts.PRIVATE_KEY_CHECK_SUM_LENGTH / 2);
            let privateKeyCheckSum = privateKey.substr(privateKey.buffer.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH /2)

            let privateKeyWithoutCheckSum = privateKey.substr(0, privateKey.buffer.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH /2);

            //versionDetectedBuffer + privateKeyWithoutCheckSum;
            let privateKeyJustVersionHex = Buffer.concat([versionDetectedBuffer.buffer, privateKeyWithoutCheckSum.buffer]);
            

            let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyJustVersionHex);

            // console.log("checkSum", privateKeyCheckSum, "privateKeyJustVersionHex", privateKeyJustVersionHex);
            // console.log("checkSum2", checksum);

            if (checksum.toUpperCase() === privateKeyCheckSum.toHex().toUpperCase()) {
                checkSumDetected = true;

                privateKey = privateKey.substr(0, privateKey.buffer.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH / 2)
            }
        }


        if (privateKey.buffer.length !== 32){

            if (!checkSumDetected)
                throw "PRIVATE KEY  CHECK SUM is not right"

            if (!versionDetected)
                throw "PRIVATE KEY  VERSION PREFIX is not recognized"
        }
        return {result: true, privateKey: privateKey};

    }


}

export default InterfaceBlockchainAddressHelper;