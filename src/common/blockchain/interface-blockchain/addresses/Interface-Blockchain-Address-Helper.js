import ed25519 from "common/crypto/ed25519";

import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import BufferExtended from 'common/utils/BufferExtended';

// tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
// full demo https://bstavroulakis.com/demos/billcoin/address.php

//video tutorial https://asecuritysite.com/encryption/base58

import consts from 'consts/const_global';
import AdvancedMessages from "node/menu/Advanced-Messages"

class InterfaceBlockchainAddressHelper{

    constructor (){

    }

    static _generatePrivateKeyAdvanced(salt, showDebug, privateKeyWIF){

        //tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript

        let privateKey;

        if (privateKeyWIF !== undefined && privateKeyWIF !== null) {
            let result = InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKeyWIF);
            if (result.result) {
                privateKey = result.privateKey;
            }
        }

        if (privateKey === undefined) {
            privateKey = ed25519.generatePrivateKey();
        }


        //if you want to follow the step-by-step results in this article, comment the
        //previous code and uncomment the following

        if (showDebug) {
            console.log("privateKeyHex", privateKey.toString("hex"), "length", privateKey.length) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD
        }

        /**
         * Private Key was calculated before
         * Let's calculate the PrivateKeyWIF (with checksum)
         */

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes
        let privateKeyAndVersion = Buffer.concat( [ Buffer.from(consts.ADDRESSES.PRIVATE_KEY.WIF.VERSION_PREFIX, "hex"),  privateKey] );
        let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyAndVersion, showDebug);


        //append checksum to end of the private key and version
        let keyWithChecksum = Buffer.concat( [privateKeyAndVersion, checksum]);

        if (showDebug)
            console.log("keyWithChecksum", keyWithChecksum, typeof keyWithChecksum); //"801184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD206EC97E"

        privateKeyWIF = keyWithChecksum;

        if (showDebug) {
            console.log("privateKeyWIF", privateKeyWIF.toString("hex"), "length", privateKeyWIF.length); //base58 "5Hx15HFGyep2CfPxsJKe2fXJsCVn5DEiyoeGGF6JZjGbTRnqfiD"
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
            console.error("ERROR! ",  privateKeyWIF, " is not a Buffer");
            throw {message: 'privateKeyWIF must be a Buffer', privateKeyWIF: privateKeyWIF};
        }

        let validation = InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKeyWIF);

        if (showDebug)
            console.log("VALIDATION", validation);

        let privateKey = undefined;

        if (validation.result === false) return validation;
        else privateKey = validation.privateKey;

        if (showDebug)
            console.log("privateKey", privateKey, typeof privateKey);

        // get the public key in a compressed format
        const pubKey = ed25519.generatePublicKey(privateKey);

        if (showDebug)
            console.log("pubKey", pubKey);

        return new Buffer(pubKey);
    }

    static verifySignedData(msg, signature, pubKey){
        return ed25519.verify(signature, msg, pubKey)
    }

    static signMessage(msg, privateKey){
        return ed25519.sign(msg, privateKey);
    }

    static _generateUnencodedAddressFromPublicKey(publicKey, showDebug){

        if (!Buffer.isBuffer(publicKey))
            throw {message: 'publicKey must be a Buffer', publicKey: publicKey};

        //bitcoin original
        let unencodedAddress =  WebDollarCrypto.RIPEMD160(WebDollarCrypto.SHA256(publicKey));

        if (showDebug)
            console.log("hash160 hex", unencodedAddress.toString('hex') ); //"3c176e659bea0f29a3e9bf7880c112b1b31b4dc8"

        return unencodedAddress;
    }

    static _generateAddressFromPublicKey(publicKey, showDebug){

        let unencodedAddress = InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(publicKey, showDebug);

        let addressWIF = InterfaceBlockchainAddressHelper.generateAddressWIF(unencodedAddress);

        if (showDebug)
            console.log("addressWIF", BufferExtended.toBase(addressWIF)); //16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS

        return  {
            unencodedAddress: unencodedAddress,
            addressWIF: BufferExtended.toBase(addressWIF),
            address: BufferExtended.toBase(unencodedAddress),
        };
    }

    static generateAddressWIF(address, showDebug, toBase = false){

        if (!Buffer.isBuffer(address) && typeof address === "string")
            address = BufferExtended.fromBase(address);

        let prefix = ( consts.ADDRESSES.ADDRESS.USE_BASE64 ? consts.ADDRESSES.ADDRESS.WIF.PREFIX_BASE64 : consts.ADDRESSES.ADDRESS.WIF.PREFIX_BASE58);
        let suffix = ( consts.ADDRESSES.ADDRESS.USE_BASE64 ? consts.ADDRESSES.ADDRESS.WIF.SUFFIX_BASE64 : consts.ADDRESSES.ADDRESS.WIF.SUFFIX_BASE58);

        //maybe address is already a
        if (address.length === consts.ADDRESSES.ADDRESS.LENGTH + consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH  + consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2 + prefix.length/2 + suffix.length/2)
            return (toBase ? BufferExtended.toBase(address) : address);

        address = Buffer.concat ( [ Buffer.from(consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX,"hex"), address ]) ; //if using testnet, would use 0x6F or 111.

        let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(address, showDebug);

        let addressWIF = Buffer.concat([
            Buffer.from( prefix , "hex"),
            address,
            checksum,
            Buffer.from( suffix, "hex")
        ]);


        return (toBase ? BufferExtended.toBase(addressWIF) : addressWIF);
    }

    static generateAddress(salt, privateKeyWIF){

        let privateKey, publicKey, address;

        let invalidAddress = true;

        while (invalidAddress) {

            privateKey = InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced(salt, false, privateKeyWIF);
            publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, false);
            address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, false);

            try {
                if (InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address.address) !== null)
                    invalidAddress = false;
            } catch (exception){
                console.error("Address is invalid", address.address, address.address.length);
                InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address.address);
            }

        }

        return {
            address: address.address,
            addressWIF: address.addressWIF,

            unencodedAddress: address.unencodedAddress,

            publicKey: publicKey,
            privateKey: privateKey,
        };
    }

    /**
     * address is usually a Base string and it coins Version+Checksum+Address
     * @param address
     */
    static getUnencodedAddressFromWIF(address){

        if (typeof address === "string")  //base
            address = BufferExtended.fromBase(address);

        if (typeof address === "object" && address.hasOwnProperty("unencodedAddress"))
            address = address.unencodedAddress;


        try {
            let result = this._validateAddressWIF(address);

            if (result.result === true) return result.unencodedAddress;
            else  return null;

        } catch (exception){
            return null;
        }
    }

    static _calculateChecksum(privateKeyAndVersion, showDebug){

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes

        if (!Buffer.isBuffer(privateKeyAndVersion) && typeof privateKeyAndVersion === 'string')
            privateKeyAndVersion = Buffer.from(privateKeyAndVersion, 'hex');

        let secondSHA = WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(privateKeyAndVersion));
        let checksum = BufferExtended.substr(secondSHA, 0, consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH );

        if (showDebug)
            console.log("checksum", checksum.toString("hex")); //"206EC97E"

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
            throw {message: 'privateKeyWIF must be a Buffer'};
        }

        //contains VERSION prefix
        let versionDetected = false;
        let versionDetectedBuffer = '';

        if (privateKeyWIF.length === consts.ADDRESSES.PRIVATE_KEY.LENGTH + consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH  + consts.ADDRESSES.PRIVATE_KEY.WIF.VERSION_PREFIX.length/2 ){

            //console.log("Buffer.IndexOf", privateKeyWIF.indexOf( Buffer.from(ADDRESSES.PRIVATE_KEY.VERSION_PREFIX, "hex") ))

            if (privateKeyWIF.indexOf( Buffer.from(consts.ADDRESSES.PRIVATE_KEY.WIF.VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = BufferExtended.substr(privateKeyWIF, 0, consts.ADDRESSES.PRIVATE_KEY.WIF.VERSION_PREFIX.length/2 );
                privateKeyWIF = BufferExtended.substr(privateKeyWIF, consts.ADDRESSES.PRIVATE_KEY.WIF.VERSION_PREFIX.length/2);
            }

        }

        let checkSumDetected = false;

        if (privateKeyWIF.length === consts.ADDRESSES.PRIVATE_KEY.LENGTH + consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH ) {

            //console.log(privateKeyWIF, privateKeyWIF.length, 32 + consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH );
            let privateKeyWIFCheckSum = BufferExtended.substr(privateKeyWIF, privateKeyWIF.length - consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH );

            let privateKeyWithoutCheckSum = BufferExtended.substr(privateKeyWIF, 0, privateKeyWIF.length - consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH );

            //versionDetectedBuffer + privateKeyWIFWithoutCheckSum;
            let privateKeyJustVersionHex = Buffer.concat([versionDetectedBuffer, privateKeyWithoutCheckSum]);


            let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyJustVersionHex);

            // console.log("checkSum", privateKeyCheckSum, "privateKeyJustVersionHex", privateKeyJustVersionHex);
            // console.log("checkSum2", checksum);

            if (checksum.equals(privateKeyWIFCheckSum) ) {
                checkSumDetected = true;

                privateKeyWIF = BufferExtended.substr(privateKeyWIF, 0, privateKeyWIF.length - consts.ADDRESSES.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH )
            }
        }


        if (privateKeyWIF.length !== consts.ADDRESSES.PRIVATE_KEY.LENGTH){

            if (!checkSumDetected) throw {message: "PRIVATE KEY  CHECK SUM is not right"};

            if (!versionDetected) throw {message: "PRIVATE KEY  VERSION PREFIX is not recognized"};
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
            throw { message: 'addressWIF must be a Buffer', addressWIF: addressWIF };
        }

        //contains VERSION prefix
        let versionDetected = false;
        let prefixDetected = false;
        let suffixDetected = false;
        let versionDetectedBuffer = '';

        let prefix = ( consts.ADDRESSES.ADDRESS.USE_BASE64 ? consts.ADDRESSES.ADDRESS.WIF.PREFIX_BASE64 : consts.ADDRESSES.ADDRESS.WIF.PREFIX_BASE58);
        let suffix = ( consts.ADDRESSES.ADDRESS.USE_BASE64 ? consts.ADDRESSES.ADDRESS.WIF.SUFFIX_BASE64 : consts.ADDRESSES.ADDRESS.WIF.SUFFIX_BASE58);

        //prefix
        if ( addressWIF.length === consts.ADDRESSES.ADDRESS.LENGTH + consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH  + consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2 + prefix.length/2 + suffix.length/2 ){

            if ( addressWIF.indexOf( Buffer.from(prefix, "hex") ) === 0 ) {
                prefixDetected = true;
                addressWIF = BufferExtended.substr(addressWIF, prefix.length/2);
            }

        }

        if ( addressWIF.length === consts.ADDRESSES.ADDRESS.LENGTH + consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH  + consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2 + suffix.length/2 ) {

            if ( addressWIF.lastIndexOf( Buffer.from(suffix, "hex") ) === addressWIF.length - suffix.length/2 ) {
                suffixDetected = true;
                addressWIF = BufferExtended.substr(addressWIF, 0, addressWIF.length - suffix.length/2 );
            }
        }


        if (addressWIF.length === consts.ADDRESSES.ADDRESS.LENGTH + consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH  + consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2  ){

            if (addressWIF.indexOf( Buffer.from(consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX, "hex") ) === 0){
                versionDetected = true;

                versionDetectedBuffer = BufferExtended.substr(addressWIF, 0, consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2 );
                addressWIF = BufferExtended.substr(addressWIF, consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2);
            }

        }

        let checkSumDetected = false;

        if (addressWIF.length === consts.ADDRESSES.ADDRESS.LENGTH + consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH ) {

            let addressWIFCheckSum = BufferExtended.substr(addressWIF, addressWIF.length - consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH );

            let privateKeyWithoutCheckSum = BufferExtended.substr(addressWIF, 0, addressWIF.length - consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH );

            let privateKeyJustVersionHex = Buffer.concat([versionDetectedBuffer, privateKeyWithoutCheckSum]);

            let checksum = InterfaceBlockchainAddressHelper._calculateChecksum(privateKeyJustVersionHex);

            if (checksum.equals(addressWIFCheckSum) ) {
                checkSumDetected = true;

                addressWIF = BufferExtended.substr(addressWIF, 0, addressWIF.length - consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH )
            }
        }


        if (addressWIF.length !== consts.ADDRESSES.ADDRESS.LENGTH){

            if (!prefixDetected) 
                throw {message: "ADDRESS KEY  PREFIX  is not right", addressWIF: addressWIF};

            if (!suffixDetected)
                throw {message: "ADDRESS KEY  SUFFIX is not right", addressWIF: addressWIF};

            if (!checkSumDetected)
                throw {message: "ADDRESS KEY  CHECK SUM is not right", addressWIF: addressWIF};

            if (!versionDetected)
                throw {message: "ADDRESS KEY  VERSION PREFIX is not recognized", addressWIF: addressWIF};
        }

        return {result: true, unencodedAddress: addressWIF};
    }

    static askForPassword(message){

        return new Promise( async (resolve) => {

            let answer = await AdvancedMessages.input("Please enter your last password (12 words separated by space):");

            let password = answer.trim().split(' ');

            for ( let i=password.length-1; i >= 0; i-- )
                if ( password[i].length === 0 )
                    password.splice( i , 1);

            if (password.length !== 12) {
                AdvancedMessages.alert('You entered a password that has ' + password.length + ' words. It must have 12!', "Password Error", "error", 5000);
                resolve(null);
                return;
            }

            resolve(password);


        });

    }




}

export default InterfaceBlockchainAddressHelper;
