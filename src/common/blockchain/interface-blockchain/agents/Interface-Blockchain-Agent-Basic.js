const EventEmitter = require('events');
import AGENT_STATUS from "./Agent-Status";
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain"

const TIME_TO_RESYNCHRONIZE_IN_CASE_NO_NEW_BLOCKS_WERE_RECEIVED_BROWSER = consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK * 1000 * 4;
const TIME_TO_RESYNCHRONIZE_IN_CASE_NO_NEW_BLOCKS_WERE_RECEIVED_TERMINAL = consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK * 1000 * 8;

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

            if (this._prevDate !== undefined && this._prevBlocks === this.blockchain.blocks.length ) {

                if (this.status !== AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED)
                    Blockchain.synchronizeBlockchain(); //let's synchronize again

            }

            this._prevDate = new Date();
            this._prevBlocks = this.blockchain.blocks.length;

        }, process.env.BROWSER ? TIME_TO_RESYNCHRONIZE_IN_CASE_NO_NEW_BLOCKS_WERE_RECEIVED_BROWSER : TIME_TO_RESYNCHRONIZE_IN_CASE_NO_NEW_BLOCKS_WERE_RECEIVED_TERMINAL );

    }

    setBlockchain(blockchain){
        this.blockchain = blockchain;
        this.protocol.setBlockchain(blockchain);
    }



}

export default InterfaceBlockchainAgentBasic;