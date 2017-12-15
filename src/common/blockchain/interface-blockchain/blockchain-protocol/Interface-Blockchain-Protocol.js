import NodesList from 'node/lists/nodes-list'
const colors = require('colors/safe');

/**
 * Blockchain Protocol
 */
class InterfaceBlockchainProtocol{

    constructor(blockchain){

        this.blockchain = blockchain;

        NodesList.registerEvent("connected", {type: ["all"]}, (err, result) => { this._initializeNewSocket(err, result) } );
        NodesList.registerEvent("disconnected", {type: ["all"]}, (err, result ) => { this._uninitializeNewSocket(err, result ) });

    }

    _initializeNewSocket(err, socket){

        socket.on("blockchain/new-block-header", (data)=>{

            let accepted = false;

            try{

                // validating data
                if (typeof data.height !== 'number') throw 'height is not specified';
                if (typeof data.chainLength !== 'number') throw 'chainLength is not specified';
                if ( (typeof data.prevHash === 'string' || Buffer.isBuffer(data.prevHash)) === false ) throw 'prevHash is not specified';
                if ( (typeof data.hash === 'string' || Buffer.isBuffer(data.hash)) === false ) throw 'hash is not specified';

                if (data.chainLength < data.height ) throw ('chainLength is smaller than block height ?? ');

                if (this.blockchain.blocks.length <= data.chainLength){
                    accepted = true;
                }



            } catch (exception){

                console.log( colors.red("Socket Error - blockchain/new-block-header", exception.toString()) );

            }

        })

    }

    _uninitializeNewSocket(err, socket){

    }

}


export default InterfaceBlockchainProtocol;