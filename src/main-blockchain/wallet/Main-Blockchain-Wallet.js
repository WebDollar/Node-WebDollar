/* eslint-disable */
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data';
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';
import BufferExtend from "common/utils/BufferExtended";

import StatusEvents from "common/events/Status-Events";
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";

import AdvancedMessages from "node/menu/Advanced-Messages";
import Blockchain from "../Blockchain";

import NanoWalletProtocol from "common/blockchain/interface-blockchain/agents/Nano/Nano-Wallet-Protocol"
import AdvancedEmitter from "common/utils/Advanced-Emitter";

const FileSystem = require('fs');

class MainBlockchainWallet {

    constructor(blockchain, db){

        this.blockchain = blockchain;
        this.walletFileName = 'wallet.bin';

        if(db === undefined)
            this.db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.WALLET_DATABASE);
        else
            this.db = db;

        this.addresses = [];

        this.emitter = new AdvancedEmitter(100);

        NanoWalletProtocol.initializeNanoProtocolWallet(this);

    }

    async _justCreateNewAddress(salt, emptyAddress){

        let blockchainAddress = new MiniBlockchainAddress(this.db);

        if (!emptyAddress)
            await blockchainAddress.createNewAddress(salt);

        return blockchainAddress;
    }

    async createNewAddress(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt, false);

        if (! (await this._insertAddress(blockchainAddress)))
            throw {message: "Address already exists"};

        return blockchainAddress;
    }

    async createNewAddressPrivateKey(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt, false);

        if (! (await this._insertAddress(blockchainAddress)))
            throw {message: "Address already exists"};

        return blockchainAddress;
    }

    async _insertAddress(blockchainAddress){

        let answer = this.getAddress(blockchainAddress);
        if ( answer !== null )
            return false;

        this.addresses.push(blockchainAddress);
        this.emitter.emit('wallet/address-changes', blockchainAddress.address);

        await this.saveWallet();

        return true;
    }

    getUnencodedAddress(address) {
        if (Buffer.isBuffer(address))
            address = BufferExtended.toBase(address);

        return this.getAddress(address).unencodedAddress;
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

            let numAddresses = Serialization.deserializeNumber4Bytes( data, offset, );
            offset += 4;

            this.addresses = [];
            for (let i = 0; i < numAddresses; ++i) {
                this.addresses[i] = await this._justCreateNewAddress(undefined, true);
                offset += await this.addresses[i].deserializeAddress( BufferExtended.substr(buffer, offset), deserializePrivateKey );

            }

            return true;

        } catch (exception){
            console.error("Error deserializing a Wallet. ", exception);
            throw exception;
        }
    }

    async saveWallet() {

        let value = await this.serialize();

        return (await this.db.save(this.walletFileName, value));
    }

    async loadAddresses() {

        let timeout = setTimeout(()=>{

            StatusEvents.emit("validation/status", {type: "WALLET", message: "Wallet is not loaded successfully"});

            setTimeout(()=>{

                if (process.env.BROWSER)
                    location.reload();
                else
                    process.exit(1);

            }, 10*1000);

        }, 20*1000 );

        let buffer = await this.db.get(this.walletFileName, 100000, 20,true);

        clearTimeout(timeout);

        if ( !buffer )
            return false;

        try {

            await this.deserialize(buffer);

        } catch (exception){
            AdvancedMessages.alert('Wallet was not imported successfully', "Wallet Error", "error", 5000);
            this.addresses = [];
        }

        if (this.addresses.length > 0)
            this.emitter.emit('wallet/changes', this.addresses);

        return true;
    }

    async removeAddresses() {

        let answer = await this.db.remove(this.walletFileName);
        this.addresses = [];
        this.addresses = [];

        this.emitter.emit('wallet/changes', this.addresses);

        return answer;
    }

    /**
     * Finding stringAddress or address
     * @param address
     * @returns {*}
     */
    getAddress(address, returnPos = false ){

        if (typeof address === "object" && address.hasOwnProperty("address"))
            address = address.address;

        for (let i = 0; i < this.addresses.length; i++) {

            if (typeof address === "string" && address === this.addresses[i].address) return returnPos ? i : this.addresses[i];
            else if (Buffer.isBuffer(address) && address.equals( this.addresses[i].unencodedAddress) ) return returnPos ? i : this.addresses[i];
            else if (typeof address === "object" && !Buffer.isBuffer(address) && (this.addresses[i].address === address.address || this.addresses[i].unencodedAddress.equals(address.unencodedAddress))) return returnPos ? i : this.addresses[i];
        }

        return returnPos ? -1 : null;

    }

    getAddressPic(address){

        if (Buffer.isBuffer(address))
            address = BufferExtended.toBase(address);

        address = WebDollarCrypto.SHA256( address );

        return `https://www.gravatar.com/avatar/${address.toString("hex")}?d=retro&f=y`;
    }

    /**
     * @returns the mining address which will receive rewards
     */

    async getFirstAddress(){

        if (this.addresses.length === 0)
            await this.createNewAddress();

        return this.addresses[0];
    }


    /**
     * @param address
     * @returns true if privateKey of address is encrypted
     */
    async isAddressEncrypted(address){

        address = this.getAddress(address);
        if ( !address )
            throw {message: "address not found", address:address};

        return address.isPrivateKeyEncrypted();
    }

    /**
     * Export wallet addresses array
     * @param filePath is the binary file for storing addresses
     * @returns {Promise<any>}
     */
    exportWallet(filePath){

        return new Promise(resolve => {

            FileSystem.open(filePath, 'w', async (err, fd) => {

                if (err)
                    return resolve(false);

                let list = [ Serialization.serializeNumber1Byte(this.addresses.length) ];

                for (let i = 0; i < this.addresses.length; ++i) {
                    list.push( Serialization.serializeNumber1Byte(this.addresses[i].unencodedAddress.length) );
                    list.push( this.addresses[i].unencodedAddress );
                }

                let buffer = Buffer.concat(list);

                FileSystem.write(fd, buffer, 0, buffer.length, null, function (err) {

                    if (err)
                        return resolve(false);

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

                let numAddresses = Serialization.deserializeNumber1Bytes( buffer, offset );
                offset += 1;

                for (let i = 0; i < numAddresses; ++i) {

                    let len = Serialization.deserializeNumber1Bytes( buffer, offset, );
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
     * @param inputData is JSON or String
     */
    async importAddressFromJSON(inputData){

        let blockchainAddress = new MiniBlockchainAddress(this.db);

        try {

            let address, publicKey;
            let privateKey = inputData;

            //private Key object {version: "xxx", address: "HEX", publicKey: "HEX", privateKey: "HEX" }
            if (typeof inputData === "object"){
                if (!inputData.hasOwnProperty("version"))
                    throw {message:"address.version not specified", inputData: inputData};

                if (!inputData.hasOwnProperty("privateKey"))
                    throw {message: "address.privateKey not specified", inputData: inputData};

                if (inputData.version === "0.1"){
                    privateKey = inputData.privateKey;
                } else {
                    throw {message: "privateKey version is not good ", inputData: inputData.version};
                }

                if (inputData.hasOwnProperty('address'))
                    address = inputData.address;

                if (inputData.hasOwnProperty('publicKey'))
                    publicKey = inputData.publicKey;
            }

            if (typeof inputData === "string")
                privateKey = Buffer.from(inputData, "hex");

            if (Buffer.isBuffer(inputData))
                privateKey = new Buffer(inputData);

            if (typeof privateKey === "string") privateKey = Buffer.from(privateKey, "hex");
            if (typeof publicKey === "string") publicKey = Buffer.from(publicKey, "hex");


            if (address === undefined && publicKey === undefined) {
                await blockchainAddress.createNewAddress(undefined, privateKey);

            } else {
                blockchainAddress.publicKey = Buffer.from(publicKey, "hex");
                blockchainAddress.address = address;
                blockchainAddress.unencodedAddress = BufferExtended.fromBase(blockchainAddress.address);

                try {
                    await blockchainAddress.savePrivateKey(Buffer.from(privateKey, "hex"));
                } catch(err) {
                    return {result: false, message:"Address already exists!", address: blockchainAddress};
                }

            }

            if ( !(await this._insertAddress(blockchainAddress)) ) {
                return {result: false, message:"Address already exists!", address: blockchainAddress};
            }

            return {
                result: true,
                address: blockchainAddress.address,
                unencodedAddress: blockchainAddress.unencodedAddress,
                publicKey: blockchainAddress.publicKey,
            }

        } catch (exception){
            console.error("importAddressFromJSON raised an exception", exception);
            return {result: false, message: JSON.stringify(exception) };
        }

    }

    /**
     * Export the Private Key from an Address
     * @param address
     * @returns privateKeyWIF as Hex
     */
    async exportAddressToJSON(address){

        const nAddressIndex = this.getAddress(address, true);

        if (nAddressIndex === -1)
            return  {
                result : false,
                message: 'Address was not found'
            };

        return {
            result: true,
            data  : {
                version   : consts.SETTINGS.PARAMS.WALLET.VERSION,
                address   : this.addresses[nAddressIndex].address,
                publicKey : this.addresses[nAddressIndex].publicKey.toString("hex"),
                privateKey: (await this.addresses[nAddressIndex].exportAddressPrivateKeyToHex())
            }
        };
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
     *
     * @param address
     * @param password
     * @returns {Promise<*>} true if address's password is @param password
     */
    async validatePassword(address, password){

        if (typeof address === "object" && address.hasOwnProperty("address"))
            address = address.address;

        address = this.getAddress(address);

        let privateKey = await address._getPrivateKey(password);

        try {
            if (InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey)) {
                return true;
            }
        } catch (exception) {
            return false;
        }

        return false;
    }

    /**
     * @param addressString
     * @param newPassword
     * @param oldPassword
     * @returns {Promise<*>}
     */
    async encryptAddress(address, newPassword, oldPassword = undefined){

        if (typeof address === "object" && address.hasOwnProperty("address"))
            address = address.address;

        address = this.getAddress(address);

        if (await this.isAddressEncrypted(address) && oldPassword === undefined) {

            oldPassword = await InterfaceBlockchainAddressHelper.askForPassword();
            if (!oldPassword )
                return false;
        }

        let privateKey = await address._getPrivateKey(oldPassword);

        try {

            if (InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey))
                return (await address.savePrivateKey(privateKey, newPassword));

        } catch (exception) {

            AdvancedMessages.alert('Your old password is incorrect!', "Password Error", "error", 5000);
            return false;
        }

    }

    async deleteAddress(address, bIsInteractive = true, password = null){

        if (typeof address === 'object' && address.hasOwnProperty('address'))
            address = address.address;

        const index = this.getAddress(address, true);

        if (index === -1)
            return {
                result : false,
                message: 'Address was not found',
                address: address
            };

        if (await this.isAddressEncrypted(address)) {
            if (bIsInteractive === false) {
                if (!password ) {
                    return {
                        result : false,
                        message: 'Non-Interactive mode detected and a password was not provided'
                    };
                }

                address = this.getAddress(address);

                try {
                    InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(await address._getPrivateKey(password));
                }
                catch (exception) {
                    return {
                        result : false,
                        message: 'Password is incorrect'
                    };
                }
            }
            else {

                for (let tries = 3; tries >= 1; --tries) {

                    await Blockchain.blockchain.sleep(100);

                    let oldPassword = await InterfaceBlockchainAddressHelper.askForPassword(`Please enter your last password (12 words separated by space). ${tries} tries left:`);

                    if ( !oldPassword ) {
                        if (tries === 1) {
                            return {
                                result : false,
                                message: 'Password is incorrect!'
                            };
                        }

                        continue;
                    }

                    address        = this.getAddress(address);
                    let privateKey = await address._getPrivateKey(oldPassword);

                    try {
                        if (InterfaceBlockchainAddressHelper.validatePrivateKeyWIF(privateKey))
                            break;

                    }
                    catch (exception)
                    {
                        AdvancedMessages.alert('Your password is incorrect!', 'Password Error', 'error', 5000);

                        if (tries === 1)
                            return {
                                result: false,
                                message: 'Password is incorrect!'
                            };
                    }
                }
            }
        }

        let ask = true;

        if (bIsInteractive)
            ask = await AdvancedMessages.confirm(`Are you sure you want to delete ${address}`);

        if (ask) {
            let addressToDelete = this.addresses[index];

            this.addresses.splice(index, 1);

            AdvancedMessages.log("Address deleted " + addressToDelete, "Address deleted " + addressToDelete.toString());

            //setting the next minerAddress
            if (!this.blockchain.mining.minerAddress || BufferExtended.safeCompare(this.blockchain.mining.unencodedMinerAddress, addressToDelete.unencodedAddress)) {
                this.blockchain.mining.minerAddress = this.addresses.length > 0 ? this.addresses[0].address : undefined;
                this.blockchain.mining.resetMining();
            }

            await this.saveWallet();

            this.emitter.emit('wallet/changes', this.addresses);

            return {
                result: true,
                length: this.addresses.length
            };

        }
        else {
            return {
                result: false,
                message: 'Action canceled by user'
            };
        }
    }


    async loadWallet(){

        //loading the Wallet
        StatusEvents.emit('blockchain/status', {message: "Loading Wallet..."});

        try{

            let response = await this.loadAddresses();

            if (response === true)
                StatusEvents.emit('blockchain/status', {message: "Wallet Loaded Successfully"});

            if (response === false || this.addresses.length === 0) {

                console.error("create this.Wallet.createNewAddress");
                await this.createNewAddress(); //it will save automatically
                console.error("create this.Wallet.createNewAddress done");

                StatusEvents.emit('blockchain/status', {message: "Wallet Creating New Wallet"});
            }

        } catch (exception){

            StatusEvents.emit('validation/status', {message: "IndexedDB - Wallet couldn't be imported"});

        }
    }

    hasAddress(address) {
        return this.getAddress(address, true) !== -1;
    }

}

export default MainBlockchainWallet
