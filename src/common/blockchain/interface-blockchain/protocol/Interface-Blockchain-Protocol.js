import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocolForkSolver from './Interface-Blockchain-Protocol-Fork-Solver'
import InterfaceBlockchainProtocolForksManager from "./Interface-Blockchain-Protocol-Forks-Manager"

import Serialization from 'common/utils/Serialization';
import NodeProtocol from 'common/sockets/protocol/node-protocol'
import BufferExtended from "common/utils/BufferExtended"

/**
 * Blockchain Protocol
 */
class InterfaceBlockchainProtocol {

    constructor(blockchain) {

        this.blockchain = blockchain;

        this.acceptBlockHeaders = true;
        this.acceptBlocks = true;

        this.forkSolver = undefined;
        this.tipsManager = undefined;


    }

    setBlockchain(blockchain){
        this.blockchain = blockchain;

        if (this.forkSolver !== undefined)
            this.forkSolver.blockchain = blockchain;

        if (this.tipsManager !== undefined)
            this.tipsManager.blockchain = blockchain;
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

        //already connected sockets
        for (let i=0; i<NodesList.nodes.length; i++)
            this._initializeNewSocket(NodesList.nodes[i]);

        this.createForkSolver();
        this.createForksManager();
    }

    createForkSolver(){
        this.forkSolver = new InterfaceBlockchainProtocolForkSolver(this.blockchain, this);
    }

    createForksManager(){
        this.forksManager = new InterfaceBlockchainProtocolForksManager(this.blockchain, this);
    }

    propagateHeader(block,  socketsAvoidBroadcast){

        // broadcasting the new block, to everybody else
        NodeProtocol.broadcastRequest( "blockchain/header/new-block", block.getBlockHeaderWithInformation(), "all", socketsAvoidBroadcast);

    }

    _validateBlockchainHeader(data){

        if ( data=== undefined || data === null) throw {message: "data is not defined"};

        // validating data
        if (typeof data.chainLength !== 'number') throw {message: 'chainLength is not specified'};
        if (typeof data.chainStartingPoint !== 'number') throw {message: 'chainStartingPoint is not specified'};

        if (typeof data.height !== 'number') throw {message: 'height is not specified'};
        if (typeof data.header !== 'object') throw {message: 'header is not specified'};
        if (data.header === undefined ) throw {message:'header.header is not specified'};
        if (data.header.hashPrev === undefined ) throw {message:'header.hashPrev is not specified'};
        if (data.header.hash === undefined) throw {message: 'header.hash is not specified'};

        if (typeof data.header.hashPrev === 'string')
            data.header.hashPrev = Serialization.fromBase(data.header.hashPrev);

        if (typeof data.header.hash === 'string')
            data.header.hash = Serialization.fromBase(data.header.hash);

        if ((typeof data.header.nonce === 'number' || Buffer.isBuffer(data.header.nonce)) === false)
            throw {message: 'nonce is not specified'};

        if (typeof data.header.data.hashData === 'string')
            data.header.data.hashData = Serialization.fromBase(data.header.data.hashData);

        if (data.header.chainLength < data.header.height)
            throw {message: 'chainLength is smaller than block height ?? ', dataChainLength: data.header.chainLength, dataHeaderHeight: data.header.height};

        if (data.header.chainStartingPoint > data.header.height )
            throw {message: 'chainLength is smaller than block height ?? ', dataChainStartingPoint: data.header.chainStartingPoint, dataHeaderHeight: data.header.height};

    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        // sending the last block using the protocol
        if (this.acceptBlockHeaders)
            socket.node.on("get/blockchain/header/last-block", async (data)=>{

                try {

                    let answer = {};

                    console.log("get/blockchain/header/last-block length", this.blockchain.blocks.length);
                    console.log("get/blockchain/header/last-block last", this.blockchain.blocks.last === undefined);

                    if (this.blockchain.blocks.length > 0 && this.blockchain.blocks.last !== undefined)
                        answer = {
                            result: true,
                            data: this.blockchain.blocks.last.getBlockHeaderWithInformation()
                        };
                    else
                        answer = { result: false,  message: "no blocks"};

                    socket.node.sendRequest("get/blockchain/header/last-block/answer", answer );

                } catch (exception) {

                    console.error("Socket Error - get/blockchain/header/last-block/answer", exception);

                    socket.node.sendRequest( "get/blockchain/header/last-block/answer", {
                        result: false,
                        message: exception
                    });

                }

            });

        if (this.acceptBlockHeaders)
            socket.node.on("blockchain/header/new-block", async (data) => {

                /*
                    data.header.height
                    data.header.chainLength
                    data.header.prevHash
                    data.header.hash

                    data.header.data.hashData
                 */

                try {

                    if (data === null )
                        throw {message: "last block is not valid"};

                    console.log("blockchain/header/new-block received", data.chainLength||0);

                    this._validateBlockchainHeader(data);

                    if (data.height < 0)
                        throw {message: "your block is invalid"};

                    //in case the hashes are the same, and I have already the block
                    if (( data.height >= 0 && this.blockchain.blocks.length - 1 >= data.height && this.blockchain.blocks.length >= data.chainLength )) {

                        //in case the hashes are exactly the same, there is no reason why we should download it

                        if (this.blockchain.agent.light && this.blockchain.blocks.blocksStartingPoint > data.height ){
                            //you are ok
                        } else
                        if ( BufferExtended.safeCompare(this.blockchain.blocks[data.height].hash, data.header.hash) === true)
                            throw {message: "your block is not new, because I have the same block at same height"};

                    }

                    console.log("blockchain/header/new-block newForkTip");

                    await this.forksManager.newForkTip(socket, data.chainLength, data.chainStartingPoint, data.header);

                } catch (exception) {

                    if (! (typeof exception === "object" && exception.message === "your block is not new, because I have the same block at same height"))
                        console.error("Socket Error - blockchain/new-block-header", socket.node.sckAddress.addressString, exception, data);

                }


            });

        if (this.acceptBlockHeaders)
            socket.node.on("blockchain/headers-info/request-header-info-by-height", (data) => {

                // data.height

                try {

                    if (typeof data.height !== 'number')
                        throw {message: "data.height is not defined"};

                    if (this.blockchain.blocks.length <= data.height)
                        throw {message: "data.height is higher than I have ", myBlockchainLength: this.blockchain.blocks.length, height: data.height};


                    let block = this.blockchain.blocks[data.height];

                    if (block === undefined)
                        throw {message: "Block not found: ", height:data.height};

                    //console.log("blooock", block);

                    socket.node.sendRequest("blockchain/headers-info/request-header-info-by-height/" + data.height || 0, {
                        result: true,
                        header: {
                            height: block.height,
                            prevHash: block.hashPrev,
                            hash: block.hash,
                            chainLength: this.blockchain.blocks.length,
                            chainStartingPoint: this.blockchain.blocks.blocksStartingPoint
                        }
                    });



                } catch (exception) {

                    console.error("Socket Error - blockchain/headers-info/request-header-info-by-height", exception);
                    socket.node.sendRequest("blockchain/headers-info/request-header-info-by-height/" + data.height || 0, {
                        result: false,
                        message: exception,
                    });
                }
            });


        if (this.acceptBlocks)

            socket.node.on("blockchain/blocks/request-block-by-height", (data) => {

                // data.height
                // data.onlyHeader

                try {

                    if (typeof data.height !== 'number')
                        throw {message: "data.height is not defined"};

                    if (this.blockchain.blocks.length <= data.height)
                        throw {message: "data.height is higher than I have ", blockchainLength:this.blockchain.blocks.length, clientHeight:data.height};

                    let block = this.blockchain.blocks[data.height];

                    if (block === undefined)
                        throw {message: "block is empty", height: data.height};

                    socket.node.sendRequest("blockchain/blocks/request-block-by-height/" + (data.height || 0), {
                        result: true,
                        block: block.serializeBlock(data.onlyHeader || false)
                    });

                } catch (exception) {

                    console.error("Socket Error - blockchain/blocks/request-block-by-height ", exception);
                    socket.node.sendRequest("blockchain/blocks/request-block-by-height/" + data.height || 0, {
                        result: false,
                        message: exception,
                    });

                }


            });

        this.askBlockchain(socket);

    }

    _uninitializeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

    async askBlockchain(socket){

        let data = await socket.node.sendRequestWaitOnce("get/blockchain/header/last-block", undefined, "answer");

        console.log("get/blockchain/header/last-block2", data);

        try {

            if (data === null || data.result !== true)
                throw {message: "last block is not valid"};

            data = data.data;

            this._validateBlockchainHeader(data);

            //validate header
            //TODO !!!
            //in case the hashes are the same, and I have already the block
            if (( data.height >= 0 && this.blockchain.blocks.length - 1 >= data.height && this.blockchain.blocks.length >= data.chainLength )) {

                //in case the hashes are exactly the same, there is no reason why we should download it
                let myHash = this.blockchain.getHashPrev(data.height+1);
                if ( myHash !== undefined && myHash !== null && BufferExtended.safeCompare(myHash, data.header.hash) === true )
                    throw {message: "your block is not new, because I have the same block at same height"};

            }

            let result = await this.forksManager.newForkTip(socket, data.chainLength, data.chainStartingPoint, data.header);


            return result;

        } catch (exception) {

            if (! (typeof exception === "object" && exception.message === "your block is not new, because I have the same block at same height"))
                console.error("Socket Error - get/blockchain/header/last-block", exception, data);

            return false;
        }

    }

}


export default InterfaceBlockchainProtocol;