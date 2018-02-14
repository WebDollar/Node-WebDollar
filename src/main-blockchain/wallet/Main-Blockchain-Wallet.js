import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from "../../consts/const_global";
import BufferExtend from "../../common/utils/BufferExtended";
import InterfaceBlockchainAddressHelper from "../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

const colors = require('colors/safe');
const md5 = require('md5');
const EventEmitter = require('events');
const FileSystem = require('fs');

class MainBlockchainWallet{

    constructor(blockchain, db){

        this.blockchain = blockchain;
        this.walletFileName = 'wallet.bin';

        if(db === undefined)
            this.db = new InterfaceSatoshminDB();
        else
            this.db = db;

        this.addresses = [];

        this.emitter = new EventEmitter();
    }

    async _justCreateNewAddress(salt, emptyAddress){

        let blockchainAddress = new MiniBlockchainAddress(this.db);

        if (!emptyAddress)
            await blockchainAddress.createNewAddress(salt);

        return blockchainAddress;
    }

    async createNewAddress(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt, false);

        if (!await this._insertAddress(blockchainAddress))
            throw "address is not new";

        return blockchainAddress;
    }

    async createNewAddressPrivateKey(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt, false);

        if (!await this._insertAddress(blockchainAddress))
            throw "address is not new";

        return blockchainAddress;
    }

    async serialize(serializePrivateKey = false) {

        let list = [Serialization.serializeNumber4Bytes(this.addresses.length)];

        for (let i = 0; i < this.addresses.length; ++i) {
            let walletBuffer = await this.addresses[i].serializeAddress(serializePrivateKey);
            list.push(walletBuffer);
        }

        return Buffer.concat (list);
    }

    async deserialize(buffer, deserializePrivateKey = false) {

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;
        let offset = 0;

        try {

            let numAddresses = Serialization.deserializeNumber( BufferExtended.substr(data, offset, 4) );
            offset += 4;

            this.addresses = [];
            for (let i = 0; i < numAddresses; ++i) {
                this.addresses[i] = await this._justCreateNewAddress(undefined, true);
                offset += await this.addresses[i].deserializeAddress( BufferExtended.substr(buffer, offset), deserializePrivateKey );

            }

            return true;

        } catch (exception){
            console.log("Error deserializing a Wallet. ", exception);
            throw exception;
        }
    }

    async saveWallet() {

        let value = await this.serialize();

        return (await this.db.save(this.walletFileName, value));
    }

    async loadAddresses() {

        let buffer = await this.db.get(this.walletFileName);

        if ( buffer === null || buffer === undefined)
            return false;

        try {
            await this.deserialize(buffer);
        } catch (exception){
            alert('Wallet was not imported successfully');
            this.addresses = [];
        }

        if (this.addresses.length > 0)
            this.emitter.emit('wallet/changes', this.addresses );

        return true;
    }

    async removeAddresses() {

        this.addresses = [];
        let answer = await this.db.remove(this.walletFileName);

        this.emitter.emit('wallet/changes', this.addresses);

        return answer;
    }

    getAddressPic(address){

        if (Buffer.isBuffer(address))
            address = BufferExtended.toBase();

        return `https://www.gravatar.com/avatar/${md5(address)}?d=retro&f=y`;
    }
    
    /**
     * @returns the mining address which will receive rewards
     */
    async getMiningAddress(){

        if (this.addresses.length === 0)
            await this.createNewAddress();

        return this.addresses[0].address;
    }

    /**
     * Export wallet addresses array
     * @param filePath is the binary file for storing addresses
     * @returns {Promise<any>}
     */
    exportWallet(filePath){

        return new Promise(resolve => {

            FileSystem.open(filePath, 'w', async (err, fd) => {

                if (err){
                    resolve(false);
                    return;
                }

                let list = [ Serialization.serializeNumber1Byte(this.addresses.length) ];

                for (let i = 0; i < this.addresses.length; ++i) {
                    list.push( Serialization.serializeNumber1Byte(this.addresses[i].unencodedAddress.length) );
                    list.push( this.addresses[i].unencodedAddress );
                }

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
     * Import an wallet address array from a binary file
     * @param filePath is the binary file path
     * @returns {Promise<any>}
     */
    importWallet(filePath){

        return new Promise(resolve => {

            let readStream = FileSystem.createReadStream(filePath);

            readStream.on('data', async (buffer) => {

                //Deserialize public addresses and push back to addresses array
                let offset = 0;

                let numAddresses = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
                offset += 1;

                for (let i = 0; i < numAddresses; ++i) {

                    let len = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
                    offset += 1;

                    let blockchainAddress = await this._justCreateNewAddress();
                    blockchainAddress.unencodedAddress = BufferExtend.substr(buffer, offset, len);
                    blockchainAddress.address = BufferExtended.toBase(blockchainAddress.unencodedAddress);
                    offset += len;

                    this.addresses.push(blockchainAddress);
                }

                resolve(await this.saveWallet());
            });

        });
    }

    /**
     * import an Address from a PrivateKey/WIF
     * @param privateKeyWIF
     */
    async importAddressFromPrivateKey(data){

        let blockchainAddress = new MiniBlockchainAddress(this.db, undefined);

        try {

            let address, publicKey;
            let privateKey = data;

            //private Key object {version: "xxx", privateKey: "HEX" }
            if (typeof data === "object"){
                if (!data.hasOwnProperty("version")) throw ".version not specified";
                if (!data.hasOwnProperty("privateKey")) throw ".privateKey not specified";

                if (data.version === "0.1"){
                    privateKey = data.privateKey;
                } else
                    throw "privateKey version is not good "+data.version;

                if (data.hasOwnProperty('address')) address = data.address;
                if (data.hasOwnProperty('publicKey')) publicKey = data.publicKey;

            }

            if (typeof data === "string")
                privateKey = Buffer.from(data,"hex");

            if (Buffer.isBuffer(data))
                privateKey = new Buffer(data);

            if (address === undefined && publicKey === undefined) {
                await blockchainAddress.createNewAddress(undefined, privateKey);

            } else {
                blockchainAddress.publicKey = Buffer.from( publicKey, "hex");
                blockchainAddress.address = address;
                blockchainAddress.unecodedAddress = InterfaceBlockchainAddressHelper.validateAddressChecksum(address);
                await blockchainAddress.savePrivateKey(Buffer.from( privateKey, "hex"));
            }

            if (!await this._insertAddress(blockchainAddress))
                throw "address is not new";

            return {
                result:true,
                address: blockchainAddress.address,
                unencodedAddress: blockchainAddress.unencodedAddress,
                publicKey: blockchainAddress.publicKey,
            }

        } catch (exception){
            return {result:false, message: exception.toString()};
        }

    }

    /**
     * Export the Private Key from an Address
     * @param address
     * @returns privateKeyWIF as Hex
     */

    async exportPrivateKeyFromAddress(address){

        for (let i=0; i<this.addresses.length; i++)
            if (address === this.addresses[i].address || address === this.addresses[i].unencodedAddress){
                return {
                    result:true,

                    data: {
                        version: consts.WALLET_VERSION,
                        address: this.addresses[i].address,
                        publicKey: this.addresses[i].publicKey.toString("hex"),
                        privateKey: (await this.addresses[i].exportAddressPrivateKeyToHex())
                    }

                }
            }

        return {
            result:false,
            message: "Address was not found",
        }

    }

    /**
     *
     * @param addressString
     */
    async importAddressFromString(addressString){

        let blockchainAddress = await this._justCreateNewAddress();
        let unencodedAddress = BufferExtended.fromBase(addressString, "hex");

        blockchainAddress.unencodedAddress = unencodedAddress;
        blockchainAddress.address = BufferExtended.toBase(unencodedAddress);
        this.addresses.push(blockchainAddress);

        return blockchainAddress;
    }

    /**
     * @param address
     * @returns true if privateKey of address is encrypted
     */
    async isAddressEncrypted(address){

        address = this.getAddress(address);
        if (address === null)
            throw "address not found";

        return (await address.isPrivateKeyEncrypted());
    }

    /**
     * @param address
     * @param newPassword
     * * @param oldPassword
     * @returns {Promise<*>}
     */
    async encryptAddress(address, newPassword, oldPassword = undefined){

        if (await this.isAddressEncrypted(address)  && process.env.BROWSER) {

            let response = prompt("Please enter your last password (12 words separated by space)");
            oldPassword = response.trim().split(' ');

            if (oldPassword.length !== 12) {
                alert('Your old password has ' + oldPassword.length + ' words. It must have 12!');
                return false;
            }

        }

        address = this.getAddress(address);

        let privateKey = await address.getPrivateKey(oldPassword);


        try {
            if (InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey)) {
                return (await address.savePrivateKey(privateKey, newPassword));
            }
        } catch (exception) {
            alert('Your old password is incorrect!!!');
            return false;
        }

    }

    /**
     * @param address
     * @param password
     * @returns {Promise<boolean>}
     */
    async signTransaction(address, password){

        address = this.getAddress(address);
        if (address === null)
            throw "address not found";

        if (await address.isPrivateKeyEncrypted(password) === false) {
            let privateKey = await address.getPrivateKey(password);
            //TODO: Sign transaction code
            return true;
        } else {
            let privateKey = await address.getPrivateKey(password);
            //TODO: Sign transaction code
            return true;
        }
    }

    /**
     * Finding stringAddress or address
     * @param address
     * @returns {*}
     */
    getAddress(address){

        let index = this.getAddressIndex(address);
        if (index === -1)
            return null;
        else
            return this.addresses[index];
    }

    getAddressIndex(address){

        for (let i = 0; i < this.addresses.length; i++)
            if (address === this.addresses[i].address)
                return i;
            else
            if (typeof address ==="object" && (this.addresses[i].address === address.address || this.addresses[i].unencodedAddress === address.unencodedAddress))
                return i;

        return -1;
    }

    async _insertAddress(blockchainAddress){

        let index = this.getAddressIndex(blockchainAddress);
        if (index !== -1) return false;

        this.addresses.push(blockchainAddress);
        this.emitter.emit('wallet/address-changes', blockchainAddress.address );
        await this.saveWallet();

        return true;
    }

    async deleteAddress(address){


        if (typeof address === "object" && address.hasOwnProperty("address"))
            address = address.address;

        let index = this.getAddressIndex(address);
        if (index < 0)
            return {result: false, message: "Address was not found ", address: address};

        if (await this.isAddressEncrypted(address)) {

            for (let tries = 3; tries >= 1; --tries) {

                let response = prompt("Please enter your last password (12 words separated by space).  " +  tries + " tries left.");
                let oldPassword = response.trim().split(' ');

                if (oldPassword.length !== 12) {

                    alert('Your old password has ' + oldPassword.length + ' words. It must have 12!');
                    if (tries === 1)
                        return {result: false, message: "Your old password is incorrect!"};

                    continue;
                }

                address = this.getAddress(address);
                let privateKey = await address.getPrivateKey(oldPassword);
                if (privateKey === null || privateKey === undefined || privateKey.length !== 32) {
                    alert('Your old password is incorrect!!!');
                    if (tries === 1)
                        return {result: false, message: "Your old password is incorrect!"};
                } else break;
            }
        }

        let ask = confirm("Are you sure you want to delete " + address);

        if(ask){

            let addressDeleted = this.addresses[index];

            this.addresses.splice(index, 1);

            //setting the next minerAddress
            console.log("addressDeleted", addressDeleted);
            if (this.blockchain.mining.minerAddress === undefined || this.blockchain.mining.minerAddress.equals(addressDeleted.unencodedAddress) ) {
                this.blockchain.mining.minerAddress = this.addresses.length > 0 ? this.addresses[0].address : undefined;
                this.blockchain.mining.resetMining();
            }

            await this.saveWallet();
            this.emitter.emit('wallet/changes', this.addresses );

            return {result:true, length: this.addresses.length }

        } else {

            return {result: false, message: "Action canceled by user" };

        }

    }

}

export default MainBlockchainWallet