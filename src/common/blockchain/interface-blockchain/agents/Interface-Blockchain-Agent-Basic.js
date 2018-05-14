const EventEmitter = require('events');
import AGENT_STATUS from "./Agent-Status";
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain"

const TIME_TO_RESYNCHRONIZE_IN_CASE_NO_NEW_BLOCKS_WERE_RECEIVED = consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK * 1000 * 4;

class InterfaceBlockchainAgentBasic{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(100);

        this._eventEmitter.on("agent/synchronized",(data)=>{

            if (data.result)
                console.warn("Synchronization done");
            else
                console.warn( "Synchronization done FAILED");

        });

        this._status = AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED;


        this._prevBlocks = 0;
        this._prevDate = 0;

        setInterval( () => {

            if (this._prevDate !== undefined && this._prevBlocks !== this.blockchain.blocks.length ) {

                if (this.status !== AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED)
                    Blockchain.synchronizeBlockchain(); //let's synchronize again

            }

            this._prevDate = new Date();
            this._prevBlocks = this.blockchain.blocks.length;

        }, TIME_TO_RESYNCHRONIZE_IN_CASE_NO_NEW_BLOCKS_WERE_RECEIVED );

    }

    setBlockchain(blockchain){
        this.blockchain = blockchain;
        this.protocol.setBlockchain(blockchain);
    }

    get status(){
        return this._status;
    }

}

export default InterfaceBlockchainAgentBasic;