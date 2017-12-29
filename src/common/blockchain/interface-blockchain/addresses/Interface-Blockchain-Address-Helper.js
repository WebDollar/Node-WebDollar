const secp256k1 = require('secp256k1');
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import BufferExtended from 'common/utils/BufferExtended';

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
        let privateKey = WebDollarCrypto.getBufferRandomValues(32);

        //if you want to follow the step-by-step results in this article, comment the
        //previous code and uncomment the following
        //var privateKeyBytes = Crypto.util.hexToBytes("1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD")

        if (showDebug) {
            console.log("privateKeyHex", privateKey.toString("hex"), "length", privateKey.length) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD
        }

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes
        let privateKeyAndVersion = Buffer.concat( [ Buffer.from(consts.PRIVATE_KEY_VERSION_PREFIX, "hex"),  privateKey] );
        let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyAndVersion, showDebug);


        //append checksum to end of the private key and version
        let keyWithChecksum = Buffer.concat( [privateKeyAndVersion, checksum]);

        if (showDebug)
            console.log("keyWithChecksum", keyWithChecksum, typeof keyWithChecksum) //"801184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD206EC97E"

        let privateKeyWIF = keyWithChecksum;

        if (showDebug) {
            console.log("privateKeyWIF", privateKeyWIF.toString("hex"), "length", privateKeyWIF.length) //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"
            console.log("privateKey", privateKey.toString("hex"), "length", privateKey.length) //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"
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

        if (privateKey === null || !Buffer.isBuffer(privateKey) ){
            console.log("ERROR! ",  privateKey, " is not a Buffer")
            throw 'privateKey must be a Buffer';
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
            console.log("secp256k1.privateKeyVerify", secp256k1.privateKeyVerify(privateKey));
        }

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKey);

        if (showDebug)
            console.log("pubKey", pubKey);

        return new Buffer(pubKey);

        // sign the message

        let msg = WebDollarCrypto.getBufferRandomValues(32);

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey)

        // verify the signature
        if (showDebug)
            console.log("secp256k1.verify", secp256k1.verify(msg, sigObj.signature, pubKey))

    }

    static verifySignedData(msg, signature, pubKey){

        if (pubKey === null || !Buffer.isBuffer(pubKey) ){
            console.log("ERROR! ",  pubKey, " is not a Buffer")
            throw 'privateKey must be a Buffer';
        }

        if ( signature.signature !== undefined) signature = signature.signature;

        return secp256k1.verify(msg, signature, pubKey);
    }

    static signMessage(msg, privateKey){

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKey);
        return sigObj;
    }

    static _generateAddressFromPublicKey(publicKey, showDebug){

        if (!Buffer.isBuffer(publicKey)){
            console.log("ERROR! ",  publicKey, " is not a Buffer")
            throw 'publicKey must be a Buffer';
        }

        //could use publicKeyBytesCompressed as well

        //bitcoin original
        //let hash160 = CryptoJS.RIPEMD160(CryptoJS.util.hexToBytes(CryptoJS.SHA256(publicKey.toBytes())))

        let hash160 =  WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(publicKey));

        if (showDebug)
            console.log("hash160 hex", hash160.toString('hex') ) //"3c176e659bea0f29a3e9bf7880c112b1b31b4dc8"

        hash160 = Buffer.concat ( [ Buffer.from(consts.PUBLIC_ADDRESS_VERSION,"hex"), hash160 ]) ; //if using testnet, would use 0x6F or 111.

        let doubleSHA = WebDollarCrypto.SHA256(WebDollarCrypto.SHA256( hash160 ));
        let addressChecksum = BufferExtended.substr(doubleSHA, 0, consts.PRIVATE_KEY_CHECK_SUM_LENGTH);

        if (showDebug)
            console.log("addressChecksum", addressChecksum.toString("hex") ) //26268187


        let unencodedAddress = Buffer.concat([
                                Buffer.from(  consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_PREFIX_BASE64 : consts.PUBLIC_ADDRESS_PREFIX_BASE58 , "hex"),
                                hash160,
                                addressChecksum,
                                Buffer.from( consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_SUFFIX_BASE64 : consts.PUBLIC_ADDRESS_SUFFIX_BASE58, "hex")
                               ]);

        if (showDebug)
            console.log("unencodedAddress", unencodedAddress.toString("hex")) //003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187

        if (showDebug)
            console.log("address",BufferExtended.toBase(unencodedAddress)); //16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS

        return  {
            unencodedAddress: unencodedAddress,
            address: BufferExtended.toBase(unencodedAddress),
        };

    }

    static generateAddress(salt){

        let privateKey = InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced(salt, false);
        let publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKey, false);
        let address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, false)

        return {
            address: address.address,
            unencodedAddress: address.unencodedAddress,
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

        let secondSHA = WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(privateKeyAndVersion));
        let checksum = BufferExtended.substr(secondSHA, 0, consts.PRIVATE_KEY_CHECK_SUM_LENGTH );

        if (showDebug)
            console.log("checksum", checksum.toString("hex")) //"206EC97E"

        return checksum;
    }

    /*
        it returns the validity of PrivateKey

        and in case privateKey is a WIF, it returns the private key without WIF
     */
    static validatePrivateKey(privateKey){

        if (privateKey === null || !Buffer.isBuffer(privateKey) ){
            throw ('privateKey must be a Buffer');
        }

        //contains VERSION prefix
        let versionDetected = false;
        let versionDetectedBuffer = '';

        if (privateKey.length > 32 + consts.PRIVATE_KEY_VERSION_PREFIX.length ){

            //console.log("Buffer.IndexOf", privateKey.indexOf( Buffer.from(PRIVATE_KEY_VERSION_PREFIX, "hex") ))

            if (privateKey.indexOf( Buffer.from(consts.PRIVATE_KEY_VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = BufferExtended.substr(privateKey, 0, consts.PRIVATE_KEY_VERSION_PREFIX.length/2 );
                privateKey = BufferExtended.substr(privateKey, consts.PRIVATE_KEY_VERSION_PREFIX.length/2);
            }

        }

        //console.log("versionDetected", versionDetected, versionDetectedBuffer, privateKey);

        //contains CHECKSUM
        let checkSumDetected = false;

        if (privateKey.length === 32 + consts.PRIVATE_KEY_CHECK_SUM_LENGTH ) {

            //console.log(privateKey, privateKey.length, 32 + consts.PRIVATE_KEY_CHECK_SUM_LENGTH );
            let privateKeyCheckSum = BufferExtended.substr(privateKey, privateKey.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH )

            let privateKeyWithoutCheckSum = BufferExtended.substr(privateKey, 0, privateKey.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH );

            //versionDetectedBuffer + privateKeyWithoutCheckSum;
            let privateKeyJustVersionHex = Buffer.concat([versionDetectedBuffer, privateKeyWithoutCheckSum]);
            

            let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyJustVersionHex);

            // console.log("checkSum", privateKeyCheckSum, "privateKeyJustVersionHex", privateKeyJustVersionHex);
            // console.log("checkSum2", checksum);

            if (checksum.equals(privateKeyCheckSum) ) {
                checkSumDetected = true;

                privateKey = BufferExtended.substr(privateKey, 0, privateKey.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH )
            }
        }


        if (privateKey.length !== 32){

            if (!checkSumDetected)
                throw "PRIVATE KEY  CHECK SUM is not right"

            if (!versionDetected)
                throw "PRIVATE KEY  VERSION PREFIX is not recognized"
        }
        return {result: true, privateKey: privateKey};

    }


}

export default InterfaceBlockchainAddressHelper;