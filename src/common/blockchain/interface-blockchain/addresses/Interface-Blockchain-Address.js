/* eslint-disable */
import ed25519 from "common/crypto/ed25519";

import AdvancedMessages from "node/menu/Advanced-Messages";
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from './Interface-Blockchain-Address-Helper';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import Serialization from "common/utils/Serialization";
import BufferExtend from "common/utils/BufferExtended";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto';
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data';
import BufferExtended from 'common/utils/BufferExtended';
import MultiSig from "./MultiSig";

const FileSystem = require('fs');


class InterfaceBlockchainAddress{

    constructor (db){

        this.address = null;
        this.unencodedAddress = null;
        this.publicKey = null;

        if ( !db )
            this.db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.WALLET_DATABASE);
        else
            this.db = db;

        this._privateKeyForMining = undefined;

    }

    async createNewAddress(salt, privateKeyWIF){

        if (this.address !== null){
            console.log("WARNING! You overwrite the initial address");
        }

        let result = InterfaceBlockchainAddressHelper.generateAddress(salt, privateKeyWIF);

        this.address = result.addressWIF;
        this.unencodedAddress = result.unencodedAddress;
        this.publicKey = result.publicKey;

        await this.savePrivateKey(result.privateKey.privateKeyWIF);
    }

    /**
     *
     * @param data to be encrypted
     * @param password used for AES encrypt
     * @returns data encrypted with AES
     */
    encrypt(data, password) {

        if ( !password )
            return data;
        else {
            let encr = null;

            if (Array.isArray(password))
                encr = MultiSig.getMultiAESEncrypt(data, password);
            else
                encr = WebDollarCrypto.encryptAES(data, password);

            return Buffer.from(encr);
        }
    }

    /**
     *
     * @param data
     * @param password
     * @returns {*}
     */
    decrypt(data, password) {

        if ( !password )
            return data;
        else {

            let decr = null;

            if (Array.isArray(password))
                decr = MultiSig.getMultiAESDecrypt(data, password);
            else
                decr = WebDollarCrypto.decryptAES(data, password);

            return Buffer.from(decr);
        }
    }

    /**
     * @returns true if privateKey is encrypted
     */
    async isPrivateKeyEncrypted() {

        let privateKey = await this._getPrivateKey();

        try {
            if (InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey)) {
                let generatedPublicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey);
                return ! BufferExtended.safeCompare(generatedPublicKey, this.publicKey);
            }
        } catch (exception) {

            return true;
        }
    }

    /**
     * Save privateKey encrypted to local database
     * @param value privateKey's value
     * @param password Encrypt privateKey with AES using password
     * @returns database response
     */
    async savePrivateKey(value, password) {

        let key = this.address + '_privateKey';

        try {
            value = this.encrypt(value, password);
            let result = await this.db.save(key, value);

            return  result;
        }
        catch(err) {
            return 'ERROR on SAVE privateKey: ' + err;
        }
    }

    /**
     *
     * @param password is used to decrypt privateKey from database
     * @returns privateKey's value decrypted
     */
    async _getPrivateKey(password) {

        let key = this.address + '_privateKey';

        try {
            let value = await this.db.get(key);

            if ( password )
                value = this.decrypt(value, password);

            return value;
        }
        catch(err) {
            return 'ERROR on LOAD privateKey: ' + err;
        }
    }

    async getPrivateKey(password) {

        if ( this._privateKeyForMining)
            return this._privateKeyForMining;

        if ( !password && await this.isPrivateKeyEncrypted()) {

            if (!password)
                password = await InterfaceBlockchainAddressHelper.askForPassword();

            if (!password)
                return null;

        }

        let privateKey = await this._getPrivateKey(password);

        try {

            let answer = InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey);

            if (!answer.result)
                throw { message: "private key is invalid" };

            return answer.privateKey;

        } catch (exception) {

            AdvancedMessages.alert('Your password is incorrect!', "Password Error", "error", 5000);

            return null;
        }

    }

    /**
     * Removes privateKey from database
     * @returns database result
     */
    async removePrivateKey() {

        let key = this.address + '_privateKey';

        try {
            return (await this.db.remove(key));
        }
        catch(err) {
            return 'ERROR on REMOVE privateKey: ' + err;
        }
    }

    async exportAddressPrivateKeyToHex(){
        return (await this._getPrivateKey()).toString("hex");
    }

    /**
     *
     * @param fileName stores the path for privateKey file
     * @param totalMultiSig is the number of passwords used to encrypt privateKey
     * @param requiredMultiSig is the minimum required number of passwords to decrypt privateKey with multiSig
     * @returns {Promise<any>}
     */
    exportPrivateKey(fileName, totalMultiSig = 3, requiredMultiSig = 2){

        return new Promise(resolve => {

            if (totalMultiSig < requiredMultiSig){
                console.error("totalMultiSig should be greater(or equal) than requiredMultiSig!");
                resolve(false);
                return;
            }

            FileSystem.open(fileName, 'w', async (err, fd) => {

                if (err){
                    resolve(false);
                    return;
                }

                let list = [];
                let privateKey = await this._getPrivateKey();

                list.push( Serialization.serializeNumber1Byte(privateKey.length) );
                list.push( privateKey );
                list.push( Serialization.serializeNumber1Byte(totalMultiSig) );
                list.push( Serialization.serializeNumber1Byte(requiredMultiSig) );

                let buffer = Buffer.concat(list);

                FileSystem.write(fd, buffer, 0, buffer.length, null, function (err) {

                    if (err){
                        resolve(false);
                        return;
                    }

                    FileSystem.close(fd, function () {
                        resolve(true);
                    });

                });

            });

        });

    }

    /**
     * Imports privateKey from @param fileName and saves it to local database
     * @param fileName is the source file for import
     * @returns {Promise<void>}
     */
    importPrivateKey(fileName){

        return new Promise(resolve => {

            let readStream = FileSystem.createReadStream(fileName);

            readStream.on('data', async (buffer) => {

                let offset = 0;
                let len = Serialization.deserializeNumber1Bytes( buffer, offset, );
                offset += 1;

                let privateKey = BufferExtend.substr(buffer, offset, len);
                offset += len;

                let totalMultiSig = Serialization.deserializeNumber1Bytes( buffer, offset );
                offset += 1;

                let requiredMultiSig = Serialization.deserializeNumber1Bytes( buffer, offset);
                offset += 1;

                resolve({result: await this.savePrivateKey(privateKey), totalMultiSig: totalMultiSig, requiredMultiSig: requiredMultiSig});
            });

        });
    }

    /**
     * Import a private key from user input
     * @param privateKeyString is the imported text value
     */
    importPrivateKeyFromString(privateKeyString){
        return this.savePrivateKey(Buffer.from(privateKeyString, "hex"));
    }

    /**
     * Export privateKey as string
     */
    exportPrivateKeyToString(){

        return this._getPrivateKey().then( (response) => {
            return response.toString("hex");
        }).catch((err)=> {
            console.error("Cannot export privateKey as string: " + err);
            return err;
        });
    }

    /**
     * Returns a string value of address
     */
    exportAddressToString(){
        return this.address;
    }

    async serializeAddress(serializePrivateKey = false){

        let privateKeyArray = [];

        if (serializePrivateKey) {
            let privateKey = await this._getPrivateKey();
            privateKeyArray = [Serialization.serializeNumber1Byte(privateKey.length), privateKey];
        }

        return Buffer.concat( [

                                Serialization.serializeNumber1Byte(BufferExtended.fromBase(this.address).length),
                                BufferExtended.fromBase(this.address),
                                Serialization.serializeNumber1Byte(this.unencodedAddress.length),
                                this.unencodedAddress,
                                Serialization.serializeNumber1Byte(this.publicKey.length),
                                this.publicKey

                              ].concat(privateKeyArray) );
    }

    async deserializeAddress(buffer, deserializePrivateKey = false){

        buffer = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;

        let offset = 0;
        let len = 0;

        try {

            //read Address
            len = Serialization.deserializeNumber1Bytes( buffer, offset );
            offset += 1;

            this.address = BufferExtended.toBase( BufferExtend.substr(buffer, offset, len) );
            offset += len;

            if (InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(this.address) === null)
                throw {message: "address didn't pass the validateAddressChecksum "};

            this.address = InterfaceBlockchainAddressHelper.generateAddressWIF(this.address, false, true);

            //read unencodedAddress
            len = Serialization.deserializeNumber1Bytes( buffer, offset );
            offset += 1;

            let unencodedAddress = BufferExtend.substr(buffer, offset, len);
            offset += len;

            //calculating the address from the unencodedAddress
            let answer = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(unencodedAddress);
            if ( answer === null) throw {message: "unencodedAddress didn't pass the validateAddressChecksum"};

            this.unencodedAddress = answer;

            len = Serialization.deserializeNumber1Bytes( buffer, offset );
            offset += 1;

            this.publicKey = BufferExtend.substr(buffer, offset, len);
            offset += len;

            if (deserializePrivateKey){
                len = Serialization.deserializeNumber1Bytes( buffer, offset );
                offset += 1;

                let privateKey = BufferExtend.substr(buffer, offset, len);
                offset += len;

                await this.savePrivateKey(privateKey);
            }

        } catch (exception){

            console.log("error deserializing address. ", exception);
            console.log("this.address", this.address);
            console.log("this.unencodedAddress", this.unencodedAddress.toString("hex"));
            throw exception;

        }

        return offset;
    }

    async saveAddress() {

        let key = this.address.toString('hex');
        let value = await this.serializeAddress();

        try {
            return (await this.db.save(key, value));
        }
        catch(err) {
            return 'ERROR on SAVE blockchain address: ' + err;
        }
    }

    async loadAddress() {

        let key = this.address.toString('hex');

        try {
            let value = await this.db.get(key);

            if ( !value )
                return false;

            await this.deserializeAddress(value);

            return true;
        }
        catch(err) {
            console.log( 'ERROR on LOAD blockchain address: ' , err);
            return false;
        }
    }

    async removeAddress() {

        let key = this.address.toString('hex');

        try {
            return (await this.db.remove(key));
        }
        catch(err) {
            return 'ERROR on REMOVE blockchain address: ' , err;
        }
    }

    async signMessage(serialization, password, returnPublicKey = false){

        let addressGenerated;

        try{

            let privateKey = await this.getPrivateKey(password);

            addressGenerated = InterfaceBlockchainAddressHelper.generateAddress(undefined, privateKey);

        } catch (exception) {
            console.error("Error Getting Private Key", exception);
            throw exception;
        }

        try{

            let signature = ed25519.sign( serialization, addressGenerated.privateKey.privateKey );

            if (returnPublicKey ) return {signature: signature, publicKey: addressGenerated.publicKey};
            else return signature;

        } catch (exception){
            console.error("Error Signing the message ", exception);
            throw exception;
        }

        return null;

    }

    async signTransaction(transaction, password){

        let privateKey = await this.getPrivateKey(password);

        let serialization, addressIndex, addressGenerated;

        try{
            addressGenerated = InterfaceBlockchainAddressHelper.generateAddress(undefined, privateKey);

            addressIndex = transaction.from.findAddressIndex(addressGenerated.unencodedAddress);

            if (addressIndex === -1)
                throw {message: "transaction not found"};

            transaction.from.addresses[addressIndex].publicKey = addressGenerated.publicKey;

            serialization = transaction.serializeFromForSigning ( addressGenerated.unencodedAddress );

        } catch (exception) {
            console.error("Error Serializing the Transaction", exception);
            throw exception;
        }

        try{

            let signature = ed25519.sign( serialization, addressGenerated.privateKey.privateKey );

            transaction.from.addresses[addressIndex].signature = signature;

            return signature;

        } catch (exception){
            console.error("Error Signing the Transaction", exception);
            throw exception;
        }

        return null;

    }

    async _toStringDebug(){

        let privateKey = await this._getPrivateKey();
        if (privateKey || (privateKey.status && privateKey.status === 404))
            privateKey = null;

        return "address" + this.address.toString() + (this.publicKey !== null ? "public key" + this.publicKey.toString() : '') + (privateKey !== null ? "private key" + privateKey.toString() : '')
    }

    toString(){
        return this.address.toString()
    }


}

export default InterfaceBlockchainAddress;
