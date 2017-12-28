import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import Serialization from "common/utils/Serialization.js";
import BufferExtend from "common/utils/BufferExtended.js";

class MainBlockchainWallets{

    constructor(blockchain, password = 'password', db){

        this.blockchain = blockchain;
        this.walletsFileName = 'wallets.bin';
        
        if(typeof db === "undefined")
            this.db = new InterfaceSatoshminDB();
        else
            this.db = db;
        
        this.password = password;
        
        if (this.loadWallets() !== true) {
            this.wallets = [this.createNewAddress()];
            this.saveWallets();
        }

    }

    createNewAddress(){

        let blockchainAddress = new MiniBlockchainAddress();
        blockchainAddress.createNewAddress();

        return blockchainAddress;
    }
    
    serializeWallets() {
        
        let buffer = Serialization.serializeNumber4Bytes(this.wallets.length);

        for (let i = 0; i < this.wallets.length; ++i) {
            this.wallets[i].encrypt(this.password);
            let walletBuffer = this.wallets[i].serializeAddress();
            this.wallets[i].decrypt(this.password);
            let lengthBuffer = Serialization.serializeNumber2Bytes(walletBuffer.length);
            
            buffer = Buffer.concat([buffer, lengthBuffer, walletBuffer]);
        }

        return buffer;
    }
    
    deserializeWallets(buffer) {

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;
        let offset = 0;
        let len = 0;

        try {

            let numWallets = len = Serialization.deserializeNumber( BufferExtend.substr(data, offset, 4) );
            offset += 4;
            
            this.wallets = [];
            for (let i = 0; i < numWallets; ++i) {
                len = Serialization.deserializeNumber( BufferExtend.substr(data, offset, 2) );
                offset += 2;

                this.wallets[i] = this.createNewAddress();
                this.wallets[i].deserializeAddress( BufferExtend.substr(data, offset, len) );
                offset += len;
                
                this.wallets[i].decrypt(this.password);
            }

        } catch (exception){
            console.log("error deserializing a Wallet. ", exception);
            throw exception;
        }
    }
    
    async saveWallets() {

        let value = this.serializeWallets();        
        return (await this.db.save(this.walletsFileName, value));
    }
    
    async loadWallets() {
        
        let buffer = await this.db.get(this.walletsFileName);
        
        if (typeof buffer.status !== "undefined")
            return false;

        this.deserializeWallets(buffer);
        return true;
    }
    
    async removeWallets() {
        
        this.wallets = [];
        return (await this.db.remove(this.walletsFileName));
    }

}

export default MainBlockchainWallets