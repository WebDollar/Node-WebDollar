import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocolForkSolver from './Interface-Blockchain-Protocol-Fork-Solver'
import Serialization from "../../../utils/Serialization";
import NodeProtocol from 'common/sockets/protocol/node-protocol'

const colors = require('colors/safe');

/**
 * Blockchain Protocol
 */
class InterfaceBlockchainProtocol {

    constructor(blockchain) {

        this.blockchain = blockchain;

        this.acceptBlockHeaders = true;
        this.acceptBlocks = true;

        this.createForkSolver();

    }

    initialize(params){

        this.acceptBlockHeaders = params.indexOf("acceptBlockHeaders") >= 0;
        this.acceptBlocks = params.indexOf("acceptBlocks") >= 0;

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._initializeNewSocket(result)
        });
        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._uninitializeSocket(result)
        });
    }

    createForkSolver(){
        this.forkSolver = new InterfaceBlockchainProtocolForkSolver(this.blockchain, this);
    }

    _setBlockchain(blockchain){
        this.blockchain = blockchain;
        this.forkSolver.blockchain = blockchain;
    }

    propagateHeader(block, chainLength, socketsAvoidBroadcast){
        // broadcasting the new block, to everybody else

        NodeProtocol.broadcastRequest( "blockchain/header/new-block", block.getBlockHeader(), "all", socketsAvoidBroadcast);

        //console.log("WEbDollar Hash", block.serializeBlock().toString("hex"));

    }

    _validateBlockchainHeader(data){

        // validating data
        if (typeof data.chainLength !== 'number') throw 'chainLength is not specified';
        if (typeof data.height !== 'number') throw 'height is not specified';

        if (typeof data.header !== 'object') throw 'header is not specified';
        if (data.header.hashPrev === undefined ) throw 'header.hashPrev is not specified';
        if (data.header.hash === undefined) throw 'header.hash is not specified';

        if (typeof data.header.hashPrev === 'string') data.header.hashPrev = Serialization.fromBase(data.header.hashPrev);
        else data.header.hashPrev = new Buffer(data.header.hashPrev);

        if (typeof data.header.hash === 'string') data.header.hash = Serialization.fromBase(data.header.hash);
        else data.header.hash = new Buffer(data.header.hash);

        if ((typeof data.header.nonce === 'number' || Buffer.isBuffer(data.header.nonce)) === false) throw 'nonce is not specified';

        if (typeof data.header.data.hashData === 'string') data.header.data.hashData = Serialization.fromBase(data.header.data.hashData);
        else data.header.data.hashData = new Buffer(data.header.data.hashData);

        if (data.header.chainLength < data.header.height) throw ('chainLength is smaller than block height ?? ');

    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        // sending the last block using the protocol
        if (this.acceptBlockHeaders)
            socket.on("get/blockchain/header/last-block", async (data)=>{

                try {

                    let answer = {};
                    if (this.blockchain.blocks.length > 0)
                        answer = {
                            result: true,
                            data: this.blockchain.blocks[this.blockchain.blocks.length-1].getBlockHeader()
                        };
                    else
                        answer = { result: false,  message: "no blocks"};

                    socket.node.sendRequest("get/blockchain/header/last-block/answer", answer );

                } catch (exception) {

                    console.log(colors.red("Socket Error - blockchain/header/last-block", exception.toString()));

                    socket.node.sendRequest( "blockchain/header/last-block", {
                        result: false,
                        message: exception.toString()
                    });

                }

            });

        if (this.acceptBlockHeaders)
            socket.on("blockchain/header/new-block", async (data) => {

                /*
                    data.header.height
                    data.header.chainLength
                    data.header.prevHash
                    data.header.hash

                    data.header.data.hashData
                 */

                try {

                    this._validateBlockchainHeader(data)

                    //validate header
                    //TODO !!!

                    if (data.height < 0)
                        throw "your block is invalid";

                    //in case the hashes are the same, and I have already the block
                    if (( data.height >= 0 && this.blockchain.getBlockchainLength() - 1 >= data.height && this.blockchain.getBlockchainLength() >= data.chainLength )) {

                        //in case the hashes are exactly the same, there is no reason why we should download it
                        if (this.blockchain.blocks[data.height].hash.equals(data.header.hash) === true)
                            throw "your block is not new, because I have a valid block at same height ";

                    }

                    let result = await this.forkSolver.discoverAndSolveFork(socket, data.chainLength, data.header)

                    socket.node.sendRequest("blockchain/header/new-block/answer/" + data.height || 0, {
                        result: true,
                        forkAnswer: (result !== null)
                    });


                } catch (exception) {

                    console.log(colors.red("Socket Error - blockchain/new-block-header", exception.toString()), data);

                    socket.node.sendRequest("blockchain/header/new-block/answer/" + data.height || 0, {
                        result: false,
                        message: exception.toString()
                    });
                }


            });

        if (this.acceptBlockHeaders)
            socket.on("blockchain/headers-info/request-header-info-by-height", (data) => {

                // data.height

                try {

                    if (typeof data.height !== 'number') throw "data.height is not defined";

                    if (this.blockchain.getBlockchainLength() < data.height) throw "data.height is higher than I have " + data.height;


                    let block = this.blockchain.blocks[data.height];

                    if (block === undefined) throw "Block not found: "+data.height;

                    //console.log("blooock", block);

                    socket.node.sendRequest("blockchain/headers-info/request-header-info-by-height/" + data.height || 0, {
                        result: true,
                        header: {
                            height: block.height,
                            prevHash: block.hashPrev,
                            hash: block.hash,
                            chainLength: this.blockchain.getBlockchainLength()
                        }
                    });


                } catch (exception) {

                    console.log(colors.red("Socket Error - blockchain/headers-info/request-header-info-by-height", exception.toString()));
                    socket.node.sendRequest("blockchain/headers-info/request-header-info-by-height/" + data.height || 0, {
                        result: false,
                        message: exception.toString()
                    });
                }
            });


        if (this.acceptBlocks)

            socket.on("blockchain/blocks/request-block-by-height", (data) => {

                // data.height
                // data.onlyheader

                try {

                    if (typeof data.height !== 'number') throw "data.height is not defined";

                    if (this.blockchain.getBlockchainLength() < data.height) throw "data.height is higher than I have";


                    let block = this.blockchain.blocks[data.height];

                    socket.node.sendRequest("blockchain/blocks/request-block-by-height/" + (data.height || 0), {
                        result: true,
                        block: block.serializeBlock(data.onlyheader || false)
                    });

                } catch (exception) {

                    console.log(colors.red("Socket Error - blockchain/blocks/request-block-by-height ", exception.toString()));
                    socket.node.sendRequest("blockchain/blocks/request-block-by-height/" + data.height || 0, {
                        result: false,
                        message: exception.toString()
                    });

                }
            });

    }

    _uninitializeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

    async askBlockchain(socket){

        let data = await socket.node.sendRequestWaitOnce("get/blockchain/header/last-block", undefined, "answer");

        console.log("get/blockchain/header/last-block2", data);
        console.log("get/blockchain/header/last-block2", data);

        try {

            if (data === null || data.result !== true) throw "last block is not valid";

            data = data.data;

            this._validateBlockchainHeader(data);

            //validate header
            //TODO !!!

            //in case the hashes are the same, and I have already the block
            if (( data.height >= 0 && this.blockchain.getBlockchainLength() - 1 >= data.height && this.blockchain.getBlockchainLength() >= data.chainLength )) {

                //in case the hashes are exactly the same, there is no reason why we should download it
                if ( this.blockchain.blocks[data.height].hash.equals(data.header.hash) === true )
                    throw "your block is not new, because I have a valid block at same height ";

            }

            let result = await this.forkSolver.discoverAndSolveFork(socket, data.chainLength, data.header);

            socket.node.sendRequest("blockchain/header/new-block/answer/" + data.height || 0, {
                result: true,
                forkAnswer: (result !== null)
            });

            return result;

        } catch (exception) {

            console.log(colors.red("Socket Error - get/blockchain/header/last-block"), exception);
            return false;
        }

    }

}


export default InterfaceBlockchainProtocol;