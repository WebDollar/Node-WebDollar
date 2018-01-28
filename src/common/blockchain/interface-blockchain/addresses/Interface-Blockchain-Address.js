import InterfaceBlockchainAddressHelper from './Interface-Blockchain-Address-Helper'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import Serialization from "common/utils/Serialization";
import BufferExtend from "common/utils/BufferExtended";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import BufferExtended from 'common/utils/BufferExtended';
const FileSystem = require('fs');

class InterfaceBlockchainAddress{


    constructor (db, password = 'password'){

        this.address = null;

        this.publicKey = null;

        if (typeof db === 'undefined'){
            this.db = new InterfaceSatoshminDB();
            this.password = 'password';
        } else {
            this.db = db;
            this.password = password;
        }
    }

    async createNewAddress(salt){

        if (this.address !== null){
            console.log("WARNING! You overwrite the initial address")
        }

        let result = InterfaceBlockchainAddressHelper.generateAddress(salt);

        this.address = result.address;
        this.unencodedAddress = result.unencodedAddress;
        this.publicKey = result.publicKey;

        await this.savePrivateKey(result.privateKey.privateKey);
        await this.savePrivateKeyWIF(result.privateKey.privateKeyWIF);
    }

    updatePassword(newPassword){

        this.password = newPassword;
    }

    /**
     *
     * @param data to be encrypted
     * @param password used for AES encrypt
     * @returns data encrypted with AES
     */
    encrypt(data, password) {

        if (typeof password === 'undefined')
            password = this.password;

        let encr = WebDollarCrypto.encryptAES(data, password);

        return Buffer.from(encr);
    }

    /**
     *
     * @param data
     * @param password
     * @returns {*}
     */
    decrypt(data, password) {

        if (typeof password === 'undefined')
            password = this.password;

        let decr = WebDollarCrypto.decryptAES(data, password);

        return Buffer.from(decr);
    }

    /**
     * Save privateKey encrypted to local database
     * @param value privateKey's value
     * @param password Encrypt privateKey with AES using password
     * @returns database response
     */
    async savePrivateKey(value, password) {

        let key = this.address + '_privateKey';

        value = this.encrypt(value, password);

        try {
            let result = await this.db.save(key, value);
            //console.log("reesult save", result);
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
     * Save privateKeyWIF encrypted to local database
     * @param value privateKey's value
     * @param password Encrypt privateKeyWIF with AES using password
     * @returns database response
     */
    async savePrivateKeyWIF(value) {

        let key = this.address + '_privateKeyWIF';

        try {
            return (await this.db.save(key, value));
        }
        catch(err) {
            return 'ERROR on SAVE privateKeyWIF: ' + err;
        }
    }

    /**
     * @returns privateKeyWIF's value decrypted
     */
    async getPrivateKeyWIF() {

        let key = this.address + '_privateKeyWIF';

        try {
            return (await this.db.get(key));
        }
        catch(err) {
            return 'ERROR on LOAD privateKeyWIF: ' + err;
        }
    }

    /**
     * Removes privateKeyWIF from database
     * @returns database result
     */
    async removePrivateKeyWIF() {

        let key = this.address + '_privateKeyWIF';

        try {
            return (await this.db.remove(key));
        }
        catch(err) {
            return 'ERROR on REMOVE privateKeyWIF: ' + err;
        }

    }

    /**
     * @param fileName stores the path for privateKey file
     * @returns {Promise<void>}
     */
    exportPrivateKey(fileName){

        return new Promise(resolve => {

            FileSystem.open(fileName, 'w', async (err, fd) => {

                if (err){
                    resolve(false);
                    return;
                }

                let privateKeyBuffer = await this.getPrivateKey();

                FileSystem.write(fd, privateKeyBuffer, 0, privateKeyBuffer.length, null, function (err) {

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

                resolve(await this.savePrivateKey(buffer));
            });

        });
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
            if (InterfaceBlockchainAddressHelper.validateAddressChecksum(this.address).result === false) throw "address didn't pass the valdiateAddressChecksum "

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

    async save() {

        let key = this.address.toString('hex');
        let value = await this.serializeAddress();

        try {
            return (await this.db.save(key, value));
        }
        catch(err) {
            return 'ERROR on SAVE blockchain address: ' + err;
        }
    }

    async load() {

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

    async remove() {

        let key = this.address.toString('hex');

        try {
            return (await this.db.remove(key));
        }
        catch(err) {
            return 'ERROR on REMOVE blockchain address: ' , err;
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