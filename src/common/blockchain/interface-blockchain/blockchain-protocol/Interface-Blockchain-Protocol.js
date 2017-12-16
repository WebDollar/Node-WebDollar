import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocolForkSolver from 'Interface-Blockchain-Protocol-Fork-Solver'

const colors = require('colors/safe');

/**
 * Blockchain Protocol
 */
class InterfaceBlockchainProtocol{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.forkSolver = new InterfaceBlockchainProtocolForkSolver(blockchain);

        NodesList.registerEvent("connected", {type: ["all"]}, (err, result) => { this._initializeNewSocket(err, result) } );
        NodesList.registerEvent("disconnected", {type: ["all"]}, (err, result ) => { this._uninitializeSocket(err, result ) });

    }

    _initializeNewSocket(err, socket){

        socket.on("blockchain/header/new-block", (data)=>{

            /*
                data.height
                data.chainLength
                data.prevHash
                data.hash
             */


            let accepted = false;

            try{

                // validating data
                if (typeof data.height !== 'number') throw 'height is not specified';
                if (typeof data.chainLength !== 'number') throw 'chainLength is not specified';
                if ( (typeof data.prevHash === 'string' || Buffer.isBuffer(data.prevHash)) === false ) throw 'prevHash is not specified';
                if ( (typeof data.hash === 'string' || Buffer.isBuffer(data.hash)) === false ) throw 'hash is not specified';

                if (data.chainLength < data.height ) throw ('chainLength is smaller than block height ?? ');

                //in case the hashes are the same, and I have already the block
                if (this.blockchain.blocks[data.height].hash.equals(data.hash))
                    return true;

                //hashes are different

                if (this.blockchain.blocks.length <= data.chainLength){

                    if (this.blockchain.blocks.length === data.chainLength){
                        //special condition on timezone
                    } else {

                        this.forkSolver.discoverFork(socket, data.chainLength)

                    }

                    accepted = true;
                }



            } catch (exception){

                console.log( colors.red("Socket Error - blockchain/new-block-header", exception.toString()) );

            }


        });

        socket.on("blockchain/headers/request-block-by-height", (data)=>{

            // data.height

            try{

                if (typeof data.height !== 'number') throw 'data.height is not defined';

                if (this.blockchain.blocks.length < data.height) throw "data.height is higher than I have";

                let block = this.blockchain.blocks[data.height];

                socket.sendRequest( "blockchain/headers/request-block-by-height/"+block.myHeight, { height: block.myHeight, prevHash: block.hashPrev, hash: block.hash, chainLength: this.blockchain.blocks.length });

            } catch (exception){

                console.log( colors.red("Socket Error - blockchain/get-block-header", exception.toString()) );

            }
        });

    }

    _uninitializeSocket(err, socket){

    }

}


export default InterfaceBlockchainProtocol;