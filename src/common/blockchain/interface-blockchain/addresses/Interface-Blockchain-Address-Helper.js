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
        let privateKey = WebDollarCrypto.getBufferRandomValues(consts.PRIVATE_KEY_LENGTH);

        //if you want to follow the step-by-step results in this article, comment the
        //previous code and uncomment the following
        //var privateKeyBytes = Crypto.util.hexToBytes("1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD")

        if (showDebug) {
            console.log("privateKeyHex", privateKey.toString("hex"), "length", privateKey.length) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD
        }

        /**
         * Private Key was calculated before
         * Let's calculate the PrivateKeyWIF (with checksum)
         */

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

    /**
     * generate PublicKey from PrivateKeyWIF
     * @param privateKeyWIF
     * @param showDebug
     * @returns {{result, privateKey}|*}
     * @private
     */
    static _generatePublicKey(privateKeyWIF, showDebug){

        // Tutorial based on https://github.com/cryptocoinjs/secp256k1-node

        if (privateKeyWIF === null || privateKeyWIF === undefined || !Buffer.isBuffer(privateKeyWIF) ){
            console.log("ERROR! ",  privateKeyWIF, " is not a Buffer")
            throw 'privateKeyWIF must be a Buffer';
        }

        let validation = InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKeyWIF);

        if (showDebug)
            console.log("VALIDATIOn", validation)

        if (validation.result === false){
            return validation;
        } else{
            privateKeyWIF = validation.privateKey;
        }

        if (showDebug) {
            console.log("privateKeyWIF", privateKeyWIF, typeof privateKeyWIF);
            console.log("secp256k1.privateKeyVerify", secp256k1.privateKeyVerify(privateKeyWIF));
        }

        // get the public key in a compressed format
        const pubKey = secp256k1.publicKeyCreate(privateKeyWIF);

        if (showDebug)
            console.log("pubKey", pubKey);

        return new Buffer(pubKey);

        // sign the message

        let msg = WebDollarCrypto.getBufferRandomValues(32);

        // sign the message
        const sigObj = secp256k1.sign(msg, privateKeyWIF);

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

        let unencodedAddress = InterfaceBlockchainAddressHelper.generateAddressWIF(hash160);

        if (showDebug)
            console.log("unencodedAddress", unencodedAddress.toString("hex")) //003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187

        if (showDebug)
            console.log("address",BufferExtended.toBase(unencodedAddress)); //16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS

        return  {
            unencodedAddress: unencodedAddress,
            address: BufferExtended.toBase(unencodedAddress),
        };

    }

    static generateAddressWIF(address, showDebug){

        if (!Buffer.isBuffer(address))
            address = BufferExtended.fromBase(address);

        address = Buffer.concat ( [ Buffer.from(consts.PUBLIC_ADDRESS_VERSION_PREFIX,"hex"), address ]) ; //if using testnet, would use 0x6F or 111.

        let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(address, showDebug);

        let addressWIF = Buffer.concat([
            Buffer.from(  consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_PREFIX_BASE64 : consts.PUBLIC_ADDRESS_PREFIX_BASE58 , "hex"),
            address,
            checksum,
            Buffer.from( consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_SUFFIX_BASE64 : consts.PUBLIC_ADDRESS_SUFFIX_BASE58, "hex")
        ]);

        return addressWIF;
    }

    static generateAddress(salt){

        let privateKey = InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced(salt, false);
        let publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, false);
        let address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, false)

        return {
            address: address.address,
            unencodedAddress: address.unencodedAddress,
            publicKey: publicKey,
            privateKey: privateKey,
        };

    }

    /**
     * address is usually a Base string and it coins Version+Checksum+Address
     * @param address
     */
    static validateAddressChecksum(address){

        if (typeof address === "string")  //base
            address = BufferExtended.fromBase(address);

        let result = this._validateAddressWIF(address);

        if (result.result === true) return result.address;
        else return null;

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

    /**
     * it returns the validity of PrivateKey

        and in case privateKey is a WIF, it returns the private key without WIF

     * @param privateKeyWIF
     * @returns {{result: boolean, privateKey: *}}
     */
    static validatePrivateKeyWIF(privateKeyWIF){

        if (privateKeyWIF === null || !Buffer.isBuffer(privateKeyWIF) ){
            throw ('privateKeyWIF must be a Buffer');
        }

        //contains VERSION prefix
        let versionDetected = false;
        let versionDetectedBuffer = '';

        if (privateKeyWIF.length === consts.PRIVATE_KEY_LENGTH + consts.PRIVATE_KEY_CHECK_SUM_LENGTH  + consts.PRIVATE_KEY_VERSION_PREFIX.length/2 ){

            //console.log("Buffer.IndexOf", privateKeyWIF.indexOf( Buffer.from(PRIVATE_KEY_VERSION_PREFIX, "hex") ))

            if (privateKeyWIF.indexOf( Buffer.from(consts.PRIVATE_KEY_VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = BufferExtended.substr(privateKeyWIF, 0, consts.PRIVATE_KEY_VERSION_PREFIX.length/2 );
                privateKeyWIF = BufferExtended.substr(privateKeyWIF, consts.PRIVATE_KEY_VERSION_PREFIX.length/2);
            }

        }

        let checkSumDetected = false;

        if (privateKeyWIF.length === consts.PRIVATE_KEY_LENGTH + consts.PRIVATE_KEY_CHECK_SUM_LENGTH ) {

            //console.log(privateKeyWIF, privateKeyWIF.length, 32 + consts.PRIVATE_KEY_CHECK_SUM_LENGTH );
            let privateKeyWIFCheckSum = BufferExtended.substr(privateKeyWIF, privateKeyWIF.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH )

            let privateKeyWithoutCheckSum = BufferExtended.substr(privateKeyWIF, 0, privateKeyWIF.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH );

            //versionDetectedBuffer + privateKeyWIFWithoutCheckSum;
            let privateKeyJustVersionHex = Buffer.concat([versionDetectedBuffer, privateKeyWithoutCheckSum]);


            let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyJustVersionHex);

            // console.log("checkSum", privateKeyCheckSum, "privateKeyJustVersionHex", privateKeyJustVersionHex);
            // console.log("checkSum2", checksum);

            if (checksum.equals(privateKeyWIFCheckSum) ) {
                checkSumDetected = true;

                privateKeyWIF = BufferExtended.substr(privateKeyWIF, 0, privateKeyWIF.length - consts.PRIVATE_KEY_CHECK_SUM_LENGTH )
            }
        }


        if (privateKeyWIF.length !== consts.PRIVATE_KEY_LENGTH){

            if (!checkSumDetected) throw "PRIVATE KEY  CHECK SUM is not right"

            if (!versionDetected) throw "PRIVATE KEY  VERSION PREFIX is not recognized"
        }
        return {result: true, privateKey: privateKeyWIF};

    }


    /**
     * it returns the validity of PrivateKey

     and in case privateKey is a WIF, it returns the private key without WIF

     * @param addressWIF
     * @returns {{result: boolean, address: *}}
     */
    static _validateAddressWIF(addressWIF){

        if (addressWIF === null || !Buffer.isBuffer(addressWIF) ){
            throw ('privateKeyWIF must be a Buffer');
        }

        //contains VERSION prefix
        let versionDetected = false;
        let prefixDetected = false;
        let suffixDetected = false;
        let versionDetectedBuffer = '';

        let prefix = ( consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_PREFIX_BASE64 : consts.PUBLIC_ADDRESS_PREFIX_BASE58);
        let suffix = ( consts.PRIVATE_KEY_USE_BASE64 ? consts.PUBLIC_ADDRESS_SUFFIX_BASE64 : consts.PUBLIC_ADDRESS_SUFFIX_BASE58);

        //prefix
        if ( addressWIF.length === consts.PUBLIC_KEY_LENGTH + consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH  + consts.PUBLIC_ADDRESS_VERSION_PREFIX.length/2 + prefix.length/2 + suffix.length/2 ){

            if ( addressWIF.indexOf( Buffer.from(prefix, "hex") ) === 0 ) {
                prefixDetected = true;
                addressWIF = BufferExtended.substr(addressWIF, prefix.length/2);
            }

        }

        if ( addressWIF.length === consts.PUBLIC_KEY_LENGTH + consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH  + consts.PUBLIC_ADDRESS_VERSION_PREFIX.length/2 + suffix.length/2 ) {

            if ( addressWIF.indexOf( Buffer.from(suffix, "hex") ) === addressWIF.length - suffix.length/2 ) {
                suffixDetected = true;
                addressWIF = BufferExtended.substr(addressWIF, 0, addressWIF.length - suffix.length/2 );
            }
        }


        if (addressWIF.length === consts.PUBLIC_KEY_LENGTH + consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH  + consts.PUBLIC_ADDRESS_VERSION_PREFIX.length/2  ){

            if (addressWIF.indexOf( Buffer.from(consts.PUBLIC_ADDRESS_VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = BufferExtended.substr(addressWIF, 0, consts.PUBLIC_ADDRESS_VERSION_PREFIX.length/2 );
                addressWIF = BufferExtended.substr(addressWIF, consts.PUBLIC_ADDRESS_VERSION_PREFIX.length/2);
            }

        }



        let checkSumDetected = false;

        if (addressWIF.length === consts.PUBLIC_KEY_LENGTH + consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH ) {

            let addressWIFCheckSum = BufferExtended.substr(addressWIF, addressWIF.length - consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH )

            let privateKeyWithoutCheckSum = BufferExtended.substr(addressWIF, 0, addressWIF.length - consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH );

            let privateKeyJustVersionHex = Buffer.concat([versionDetectedBuffer, privateKeyWithoutCheckSum]);

            let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyJustVersionHex);

            if (checksum.equals(addressWIFCheckSum) ) {
                checkSumDetected = true;

                addressWIF = BufferExtended.substr(addressWIF, 0, addressWIF.length - consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH )
            }
        }


        if (addressWIF.length !== consts.PUBLIC_KEY_LENGTH){

            if (!prefixDetected) throw "ADDRESS KEY  PREFIX  is not right";

            if (!suffixDetected) throw "ADDRESS KEY  SUFFIX is not right";

            if (!checkSumDetected) throw "ADDRESS KEY  CHECK SUM is not right";

            if (!versionDetected) throw "ADDRESS KEY  VERSION PREFIX is not recognized";
        }
        return {result: true, address: addressWIF};

    }


}

export default InterfaceBlockchainAddressHelper;
