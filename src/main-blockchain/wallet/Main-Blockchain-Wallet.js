import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import Serialization from "common/utils/Serialization.js";
import BufferExtended from "common/utils/BufferExtended.js";

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
        
        this.loadAddresses().then(async (response) => {
            if (response === false || this.addresses.length === 0) {
                this.createNewAddress();
                await this.saveAddresses();
            }
        });

        this.emitter = new EventEmitter();

    }

    createNewAddress(){

        let blockchainAddress = new MiniBlockchainAddress(this.db, this.password);
        blockchainAddress.createNewAddress();

        this.addresses.push(blockchainAddress);

        this.emitter.emit('wallet/address-changes', blockchainAddress.address );

        //this.saveAddresses();

        return blockchainAddress;
    }

    createNewAddressPrivateKey(){

        let blockchainAddress = new MiniBlockchainAddress();
        blockchainAddress.createNewAddress();

        this.addresses.push(blockchainAddress);

        this.emitter.emit('wallet/address-changes', blockchainAddress );

        //this.saveAddresses();

        return blockchainAddress;
    }
    
    async updatePassword(newPassword){

        for (let i = 0; i < this.addresses.length; ++i) {
            let privateKey = await this.addresses[i].getPrivateKey(this.password);
            await this.addresses[i].savePrivateKey(privateKey, newPassword);
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
                this.addresses[i] = this.createNewAddress();
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
    
    async loadAddresses() {
        
        let buffer = await this.db.get(this.walletFileName);
        
        if (typeof buffer.status !== "undefined")
            return false;

        this.deserialize(buffer);

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

        return `https://www.gravatar.com/avatar/${md5(address)}?d=retro&f=y`;

    }

}

export default MainBlockchainWallet