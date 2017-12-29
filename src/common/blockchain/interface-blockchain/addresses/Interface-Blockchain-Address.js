import InterfaceBlockchainAddressHelper from './Interface-Blockchain-Address-Helper'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import Serialization from "common/utils/Serialization.js";
import BufferExtend from "common/utils/BufferExtended.js";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'

class InterfaceBlockchainAddress{


    constructor (db){

        this.address = null;

        this.publicKey = null;
        this.privateKey = null;
        
        if(typeof db === "undefined")
            this.db = new InterfaceSatoshminDB();
        else
            this.db = db;
    }

    createNewAddress(salt){


        if (this.address !== null){
            console.log("WARNING! You overwrite the initial address")
        }

        let result = InterfaceBlockchainAddressHelper.generateAddress(salt);

        this.address = result.address;
        this.unencodedAddress = result.unencodedAddress;
        this.publicKey = result.publicKey;
        this.privateKey = result.privateKey;

    }
    
    serializeAddress(){

        let buffer = Buffer.concat( [ Serialization.serializeNumber1Byte(this.address.length),
                                      this.address,
                                      Serialization.serializeNumber1Byte(this.publicKey.length),
                                      this.publicKey,
                                      Serialization.serializeNumber1Byte(this.privateKey.privateKey.length),
                                      this.privateKey.privateKey
                                    ]);

        return buffer;
    }
    
    deserializeAddress(buffer){

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;
        let offset = 0;
        let len = 0;

        try {
            
            len = Serialization.deserializeNumber( BufferExtend.substr(data, offset, 1) );
            offset += 1;
            
            this.address = BufferExtend.substr(data, offset, len);
            offset += len;

            len = Serialization.deserializeNumber( BufferExtend.substr(data, offset, 1) );
            offset += 1;
            
            this.publicKey = BufferExtend.substr(data, offset, len);
            offset += len;
            
            len = Serialization.deserializeNumber( BufferExtend.substr(data, offset, 1) );
            offset += 1;
            
            this.privateKey.privateKey = BufferExtend.substr(data, offset, len);
            offset += len;
            
        } catch (exception){
            console.log("error deserializing address. ", exception);
            throw exception;
        }
        
        return offset;
    }

    toString(){

        return this.address.toString()

    }
    
    encrypt(password) {
        
        let encr = WebDollarCrypto.encryptAES(this.privateKey.privateKey, password);
        this.privateKey.privateKey = Buffer.from(encr);
        return encr;
    }
    
    decrypt(password) {
        
        let decr = WebDollarCrypto.decryptAES(this.privateKey.privateKey, password);
        this.privateKey.privateKey = Buffer.from(decr);
        return decr;
    }
    
    async save() {
        
        let key = this.address.toString('hex');
        let value = this.serializeAddress();
        
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
            this.deserializeAddress(value);

            return true;
        }
        catch(err) {
            return 'ERROR on LOAD blockchain address: ' + err;
        }
    }
    
    async remove() {

        let key = this.address.toString('hex');
        
        try {
            return (await this.db.remove(key));
        }
        catch(err) {
            return 'ERROR on REMOVE blockchain address: ' + err;
        }

    }
    
    _toStringDebug(){

        return "address" + this.address.toString() + (this.publicKey !== null ? "public key" + this.publicKey.toString() : '') + (this.privateKey !== null ? "private key" + this.privateKey.toString() : '')
    }

    getAddressAndPrivateKey(){
        return {
            address: this.address,
            privateKey: this.privateKey,
        }
    }


}

export default InterfaceBlockchainAddress;