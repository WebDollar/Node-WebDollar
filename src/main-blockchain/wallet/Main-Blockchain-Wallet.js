import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
const colors = require('colors/safe');

const md5 = require('md5');
const EventEmitter = require('events');
const FileSystem = require('fs');

class MainBlockchainWallet{

    constructor(blockchain, password = 'password', db){

        this.blockchain = blockchain;
        this.walletFileName = 'wallet.bin';
        
        if(db === undefined)
            this.db = new InterfaceSatoshminDB();
        else
            this.db = db;


        this.addresses = [];
        
        this.password = password;

        this.emitter = new EventEmitter();

    }

    async _justCreateNewAddress(salt, emptyAddress){

        let blockchainAddress = new MiniBlockchainAddress(this.db, this.password);

        if (!emptyAddress)
            await blockchainAddress.createNewAddress(salt);

        //console.log("_justCreateNewAddress", blockchainAddress);

        return blockchainAddress;

    }

    async createNewAddress(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt, false);

        this.addresses.push(blockchainAddress);

        this.emitter.emit('wallet/address-changes', blockchainAddress.address );

        await this.saveAddresses();

        return blockchainAddress;
    }

    async createNewAddressPrivateKey(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt, false);

        this.addresses.push(blockchainAddress);

        this.emitter.emit('wallet/address-changes', blockchainAddress );

        await this.saveAddresses();

        return blockchainAddress;
    }
    
    async updatePassword(newPassword){

        for (let i = 0; i < this.addresses.length; ++i) {
            let privateKey = await this.addresses[i].getPrivateKey(this.password);
            await this.addresses[i].savePrivateKey(privateKey, newPassword);

            this.addresses[i].updatePassword(newPassword);
        }

        this.password = newPassword;

        this.emitter.emit('wallet/password-changed', {});
    }
    
    serialize(serializePrivateKey = false) {
        
        let list = [Serialization.serializeNumber4Bytes(this.addresses.length)];

        for (let i = 0; i < this.addresses.length; ++i) {
            let walletBuffer = this.addresses[i].serializeAddress(serializePrivateKey);
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
            console.log("error deserializing a Wallet. ", exception);
            throw exception;
        }
    }
    
    async saveAddresses() {

        let value = this.serialize();  

        return (await this.db.save(this.walletFileName, value));
    }
    
    loadAddresses() {

        return new Promise( async (resolve)=>{

            //timeout, max 10 seconds to load the database
            let timeout = setTimeout(()=>{
                console.log(colors.red("LOAD ADDRESSES FROZE AND FAILED !!"));
                resolve(false);
                return false;
            }, 10000);

            let buffer = await this.db.get(this.walletFileName);

            clearTimeout(timeout);

            if ( buffer === null) {
                resolve(false);
                return false;
            }

            try {
                await this.deserialize(buffer);
            } catch (exception){
                alert('Wallet was not imported successfully');
                this.addresses = [];
            }

            await this.updatePassword(this.password);

            if (this.addresses.length > 0)
                this.emitter.emit('wallet/changes', this.addresses );

            resolve(true);


        })


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

    async getMiningAddress(){

        if (this.addresses.length === 0)
            await this.createNewAddress();

        return this.addresses[0].address;

    }

    export(filePath){

        return FileSystem.open(filePath, 'w', function(err, fd) {

            if (err) {
                throw 'could not open file: ' + err;
            }

            let walletBuffer = this.serialize(true);

            FileSystem.write(fd, walletBuffer, 0, walletBuffer.length, null, function(err) {
                if (err) {
                    throw 'Error exporting wallet: ' + err;
                }
                FileSystem.close(fd, function() {
                    console.log('Wallet exported successfully!');
                    return true;
                });
            });
        });
    }

    async import(filePath){

        let buffer =  FileSystem.readFile(filePath, 'utf8');

        return (await this.deserialize(buffer, true));
    }

}

export default MainBlockchainWallet