import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import Serialization from "common/utils/Serialization.js";
import BufferExtended from "common/utils/BufferExtended.js";
const colors = require('colors/safe');

const md5 = require('md5');
const EventEmitter = require('events');

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

    async _justCreateNewAddress(salt){

        let blockchainAddress = new MiniBlockchainAddress(this.db, this.password);
        await blockchainAddress.createNewAddress();

        return blockchainAddress;

    }

    async createNewAddress(salt){

        let blockchainAddress = await this._justCreateNewAddress(salt);

        this.addresses.push(blockchainAddress);

        this.emitter.emit('wallet/address-changes', blockchainAddress.address );

        await this.saveAddresses();

        return blockchainAddress;
    }

    async createNewAddressPrivateKey(){

        let blockchainAddress = await this._justCreateNewAddress(salt);

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
    
    serialize() {
        
        let list = [Serialization.serializeNumber4Bytes(this.addresses.length)];

        for (let i = 0; i < this.addresses.length; ++i) {
            let walletBuffer = this.addresses[i].serializeAddress();
            list.push(walletBuffer);
        }

        return Buffer.concat (list);
    }
    
    deserialize(buffer) {

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;
        let offset = 0;

        try {

            let numAddresses = Serialization.deserializeNumber( BufferExtended.substr(data, offset, 4) );
            offset += 4;
            
            this.addresses = [];
            for (let i = 0; i < numAddresses; ++i) {
                this.addresses[i] = this._justCreateNewAddress(undefined, false);
                offset += this.addresses[i].deserializeAddress( BufferExtended.substr(buffer, offset) );
            }

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
            setTimeout(()=>{
                console.log(colors.red("LOAD ADDRESSES FROZE AND FAILED !!"));
                resolve(false);
            }, 10000);

            let buffer = await this.db.get(this.walletFileName);

            if (typeof buffer.status !== "undefined")
                resolve(false);

            this.deserialize(buffer);

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

}

export default MainBlockchainWallet