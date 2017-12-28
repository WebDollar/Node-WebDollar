import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import Serialization from "common/utils/Serialization.js";
import BufferExtended from "common/utils/BufferExtended.js";

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
            let walletBuffer = this.wallets[i].serializeAddress();
            buffer = Buffer.concat([buffer, walletBuffer]);
        }

        return buffer;
    }
    
    deserializeWallets(buffer) {

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;
        let offset = 0;

        try {

            let numWallets = Serialization.deserializeNumber( BufferExtended.substr(data, offset, 4) );
            offset += 4;
            
            this.wallets = [];
            for (let i = 0; i < numWallets; ++i) {
                this.wallets[i] = this.createNewAddress();
                offset += this.wallets[i].deserializeAddress( BufferExtended.substr(buffer, offset) );
            }

        } catch (exception){
            console.log("error deserializing a Wallet. ", exception);
            throw exception;
        }
    }
    
    async saveWallets() {
        
        for (let i = 0; i < this.wallets.length; ++i)
            this.wallets[i].encrypt(this.password);

        let value = this.serializeWallets();  

        for (let i = 0; i < this.wallets.length; ++i)
            this.wallets[i].decrypt(this.password);

        return (await this.db.save(this.walletsFileName, value));
    }
    
    async loadWallets() {
        
        let buffer = await this.db.get(this.walletsFileName);
        
        if (typeof buffer.status !== "undefined")
            return false;

        this.deserializeWallets(buffer);

        for (let i = 0; i < this.wallets.length; ++i)
            this.wallets[i].decrypt(this.password);

        return true;
    }
    
    async removeWallets() {
        
        this.wallets = [];
        return (await this.db.remove(this.walletsFileName));
    }

}

export default MainBlockchainWallets