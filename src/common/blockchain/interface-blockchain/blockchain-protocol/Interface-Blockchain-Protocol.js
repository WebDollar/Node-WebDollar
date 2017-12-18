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

    _initializeNewSocket(err, socket) {

        socket.on("blockchain/header/new-block", async (data) => {

            /*
                data.height
                data.chainLength
                data.prevHash
                data.hash
             */


            try {

                // validating data
                if (typeof data.height !== 'number') throw 'height is not specified';
                if (typeof data.chainLength !== 'number') throw 'chainLength is not specified';
                if ((typeof data.prevHash === 'string' || Buffer.isBuffer(data.prevHash)) === false) throw 'prevHash is not specified';
                if ((typeof data.hash === 'string' || Buffer.isBuffer(data.hash)) === false) throw 'hash is not specified';

                if (data.chainLength < data.height) throw ('chainLength is smaller than block height ?? ');

                //in case the hashes are the same, and I have already the block
                if (this.blockchain.blocks[data.height].hash.equals(data.hash))
                    return true;

                //hashes are different
                if (this.blockchain.getBlockchainLength() <= data.chainLength) {

                    if (this.blockchain.getBlockchainLength() === data.chainLength) {

                        // most complex hash, let's download him
                        if (data.hash.compare(this.blockchain.getBlockchainLastBlock().hash) < 0) {

                            let block = await socket.sendRequestWaitOnce("blockchain/block/request-block-by-height", {height: data.height}, data.height);
                            if (block !== null) {
                                await this.blockchain.includeBlockchainBlock(block);
                                return;
                            }

                        } else
                            await this.forkSolver.discoverFork(socket, data.chainLength)

                    } else { // the socket has a bigger chain

                        await this.forkSolver.discoverFork(socket, data.chainLength)

                    }


                }


            } catch (exception) {

                console.log(colors.red("Socket Error - blockchain/new-block-header", exception.toString()));
            }


        });

        socket.on("blockchain/headers/request-block-by-height", (data) => {

            // data.height

            try {

                if (typeof data.height !== 'number') throw 'data.height is not defined';

                if (this.blockchain.getBlockchainLength() < data.height) throw "data.height is higher than I have";

                let block = this.blockchain.blocks[data.height];

                socket.sendRequest("blockchain/headers/request-block-by-height/" + block.height, {
                    height: block.height,
                    prevHash: block.hashPrev,
                    hash: block.hash,
                    chainLength: this.blockchain.getBlockchainLength()
                });

            } catch (exception) {

                console.log(colors.red("Socket Error - blockchain/get-block-header", exception.toString()));

            }
        });

    }

    _uninitializeSocket(err, socket) {

    }

}


export default InterfaceBlockchainProtocol;