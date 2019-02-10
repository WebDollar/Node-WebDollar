import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import SemaphoreProcessing from "common/utils/Semaphore-Processing"
import InterfaceBlockchainBlocks from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Blocks'
import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'
import BlockchainTimestamp from "common/blockchain/interface-blockchain/timestmap/Blockchain-Timestamp"
import InterfaceBlockchainTipsAdministrator from "./tips/Interface-Blockchain-Tips-Administrator";
import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'

class InterfaceBlockchainBasic{

    constructor(agent){

        this._blockchainLoaded = false;

        this.agent = agent;

        this.db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE.FOLDER);

        this.blocks = new InterfaceBlockchainBlocks(this, this.db);

        this.mining = undefined;

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this );
        this.tipsAdministrator = new InterfaceBlockchainTipsAdministrator ( this );

        this.timestamp = new BlockchainTimestamp();

        this._createBlockchainElements();

        this.semaphoreProcessing = new SemaphoreProcessing();

    }


    _setAgent(newAgent){
        this.agent = newAgent;
    }

    _createBlockchainElements(){
        this.transactions = new InterfaceBlockchainTransactions( this);
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, InterfaceBlockchainBlock, InterfaceBlockchainBlockData);
    }


    async loadBlockchain(){

        if (this._blockchainLoaded) return true;
        if (!this.agent.consensus) return true; //no consensus

        StatusEvents.emit('blockchain/status', {message: "Blockchain Loading"});

        let loaded = await this._loadBlockchain();

        StatusEvents.emit('blockchain/status', {message: "Blockchain Loaded Successfully"});

        return loaded;

    }

    async _loadBlockchain(){
        return true;
    }


    toString(){
    }

    toJSON(){
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}

export default InterfaceBlockchainBasic