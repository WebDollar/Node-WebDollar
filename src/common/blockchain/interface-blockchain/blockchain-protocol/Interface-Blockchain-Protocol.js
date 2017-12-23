import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocolForkSolver from './Interface-Blockchain-Protocol-Fork-Solver'

const colors = require('colors/safe');

/**
 * Blockchain Protocol
 */
class InterfaceBlockchainProtocol {

    constructor(blockchain) {

        this.blockchain = blockchain;

        this.forkSolver = new InterfaceBlockchainProtocolForkSolver(blockchain);

        NodesList.registerEvent("connected", {type: ["all"]}, (err, result) => {
            this._initializeNewSocket(err, result)
        });
        NodesList.registerEvent("disconnected", {type: ["all"]}, (err, result) => {
            this._uninitializeSocket(err, result)
        });

    }

    _initializeNewSocket(err, nodesListObject) {

        let socket = nodesListObject.socket;

        socket.on("blockchain/header/new-block", async (data) => {

            /*
                data.header.height
                data.header.chainLength
                data.header.prevHash
                data.header.hash

                data.header.data.hashData
             */


            try {

                let answer = {result: false, message: ""};

                // validating data
                if (typeof data.chainLength !== 'number') throw 'chainLength is not specified';
                if (typeof data.height !== 'number') throw 'height is not specified';

                if (typeof data.header !== 'object') throw 'header is not specified';
                if ((typeof data.header.hashPrev === 'string' || Buffer.isBuffer(data.header.hashPrev)) === false) throw 'hashPrev is not specified';
                if ((typeof data.header.hash === 'string' || Buffer.isBuffer(data.header.hash)) === false) throw 'hash is not specified';
                if ((typeof data.header.data.hashData === 'string' || Buffer.isBuffer(data.header.data.hashData)) === false) throw 'hashData is not specified';
                if ((typeof data.header.nonce === 'number' || Buffer.isBuffer(data.header.nonce)) === false) throw 'nonce is not specified';

                if (data.header.chainLength < data.header.height) throw ('chainLength is smaller than block height ?? ');

                //validate header
                //TO DO !!!

                let result = false;

                //in case the hashes are the same, and I have already the block
                if (( data.height >= 0 && this.blockchain.getBlockchainLength() - 1 >= data.height && this.blockchain.getBlockchainLength() >= data.chainLength )) {

                    //in case the hashes are exactly the same, there is no reason why we should download it
                    if (this.blockchain.blocks[data.height].hash.equals(data.header.hash) === true)
                        throw "your block is not new, because I have a valid block at same height ";

                }

                result = await this.forkSolver.discoverAndSolveFork(socket, data.chainLength, data.header)


                socket.node.sendRequest("blockchain/header/new-block/answer/" + data.height || 0, {
                    result: true,
                    forkAnswer: (result !== null)
                });


            } catch (exception) {

                console.log(colors.red("Socket Error - blockchain/new-block-header", exception.toString()));

                socket.node.sendRequest("blockchain/header/new-block/answer/" + data.height || 0, {
                    result: false,
                    message: exception.toString()
                });
            }


        });

        socket.on("blockchain/headers/request-block-by-height", (data) => {

            // data.height

            try {

                if (typeof data.height !== 'number') throw "data.height is not defined";

                if (this.blockchain.getBlockchainLength() < data.height) throw "data.height is higher than I have " + data.height;


                let block = this.blockchain.blocks[data.height];

                if (block === undefined) throw "Block not found: "+data.height;

                //console.log("blooock", block);

                socket.node.sendRequest("blockchain/headers/request-block-by-height/" + data.height || 0, {
                    result: true,
                    header: {
                        height: block.height,
                        prevHash: block.hashPrev,
                        hash: block.hash,
                        chainLength: this.blockchain.getBlockchainLength()
                    }
                });


            } catch (exception) {

                console.log(colors.red("Socket Error - blockchain/headers/request-block-by-height", exception.toString()));
                socket.node.sendRequest("blockchain/headers/request-block-by-height/" + data.height || 0, {
                    result: false,
                    message: exception.toString()
                });
            }
        });


        socket.on("blockchain/blocks/request-block-by-height", (data) => {

            // data.height

            try {

                if (typeof data.height !== 'number') throw "data.height is not defined";

                if (this.blockchain.getBlockchainLength() < data.height) throw "data.height is higher than I have";


                let block = this.blockchain.blocks[data.height];

                socket.node.sendRequest("blockchain/blocks/request-block-by-height/" + (data.height || 0), {
                    result: true,
                    block: block.serializeBlock()
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

    _uninitializeSocket(err, nodesListObject) {

        let socket = nodesListObject.socket;

    }

}


export default InterfaceBlockchainProtocol;