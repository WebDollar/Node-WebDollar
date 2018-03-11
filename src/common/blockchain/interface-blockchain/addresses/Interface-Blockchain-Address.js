const FileSystem = require('fs');
import ed25519 from "common/crypto/ed25519";

import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from './Interface-Blockchain-Address-Helper';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import Serialization from "common/utils/Serialization";
import BufferExtend from "common/utils/BufferExtended";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto';
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data';
import BufferExtended from 'common/utils/BufferExtended';
import MultiSig from "./MultiSig";


class InterfaceBlockchainAddress{

    constructor (db){

        this.address = null;
        this.publicKey = null;

        if (db === undefined){
            this.db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.WALLET_DATABASE);
        } else {
            this.db = db;
        }

    }

    async createNewAddress(salt, privateKeyWIF){

        if (this.address !== null){
            console.log("WARNING! You overwrite the initial address")
        }

        let result = InterfaceBlockchainAddressHelper.generateAddress(salt, privateKeyWIF);

        this.address = result.address;
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

        if (password === undefined)
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

        if (password === undefined)
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

        let privateKey = await this.getPrivateKey();

        try {
            if (InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey)) {
                let generatedPublicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey);
                return !generatedPublicKey.equals(this.publicKey);
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
    async getPrivateKey(password) {

        let key = this.address + '_privateKey';

        try {
            let value = await this.db.get(key);

            if (password !== undefined)
                value = this.decrypt(value, password);

            return value;
        }
        catch(err) {
            return 'ERROR on LOAD privateKey: ' + err;
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
                let privateKey = await this.getPrivateKey();

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
                let len = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );
                offset += 1;

                let privateKey = BufferExtend.substr(buffer, offset, len);
                offset += len;

                let totalMultiSig = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );
                offset += 1;

                let requiredMultiSig = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );

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

        return this.getPrivateKey().then( (response) => {
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

    //TODO REMOVE THIS FUNCTION!!!!!!!!!!!!!!
    async exportAddressPrivateKeyToHex(){
        return (await this.getPrivateKey()).toString("hex");
    }

    async serializeAddress(serializePrivateKey = false){

        let privateKeyArray = [];

        if (serializePrivateKey) {
            let privateKey = await this.getPrivateKey();
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
            len = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );
            offset += 1;

            this.address = BufferExtended.toBase( BufferExtend.substr(buffer, offset, len));
            offset += len;

            //read unencodedAddress
            len = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );
            offset += 1;

            this.unencodedAddress = BufferExtend.substr(buffer, offset, len);
            offset += len;

            //calcuating the address from the unencodedAddress
            if (InterfaceBlockchainAddressHelper.validateAddressChecksum(this.address).result === false)
                throw "address didn't pass the valdiateAddressChecksum ";

            len = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );
            offset += 1;

            this.publicKey = BufferExtend.substr(buffer, offset, len);
            offset += len;

            if (deserializePrivateKey){
                len = Serialization.deserializeNumber( BufferExtend.substr(buffer, offset, 1) );
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

            if (value === null) return false;

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

    async signTransaction(transaction, password){

        let privateKey;

        if (await this.isPrivateKeyEncrypted()) {

            if (password === undefined) password = InterfaceBlockchainAddressHelper.askForPassword();
            if (password === null) return null;

        } else password = undefined;

        privateKey = await this.getPrivateKey(password);

        try {

            let answer = InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey);

            if (! answer.result) throw { message: "private key is invalid" };

            privateKey = answer.privateKey;

        } catch (exception) {
            alert('Your password is incorrect!!! ' + exception.toString());
            return null;
        }

        try{
            let answer = InterfaceBlockchainAddressHelper.generateAddress(undefined, privateKey);

            let index = transaction.from.findAddressIndex(answer.unencodedAddress);

            if (index === -1) throw {message: "transaction not found"};

            transaction.from.addresses[index].publicKey = answer.publicKey;

            let serialization = transaction.serializeFromForSigning (answer.unencodedAddress);

            //let signature = schnorr.sign( serialization, answer.privateKey.privateKey );
            let signature = ed25519.sign( serialization, answer.privateKey.privateKey );

            let signatureFinal = new Buffer( signature.s.toString(16), 16 );

            transaction.from.addresses[index].signature = signatureFinal;

            return signatureFinal;

        } catch (exception) {
            console.error(exception);
        }
    }

    async _toStringDebug(){

        let privateKey = await this.getPrivateKey();
        if (privateKey !== null || (privateKey.status !== undefined && privateKey.status === 404))
            privateKey = null;

        return "address" + this.address.toString() + (this.publicKey !== null ? "public key" + this.publicKey.toString() : '') + (privateKey !== null ? "private key" + privateKey.toString() : '')
    }

    toString(){
        return this.address.toString()
    }


}

export default InterfaceBlockchainAddress;