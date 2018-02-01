const colors = require('colors/safe');
import InterfaceBlockchainProtocol from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol'
import Serialization from 'common/utils/Serialization'
import consts from "consts/const_global";
import PPoWBlockchainProtocol from "common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol"

/**
 * MiniBlockchainProtocol only extends the initial Protocol in order to validate the hashAccountantTree
 */

let inheritProtocol;
if (consts.POPOW_ACTIVATED) inheritProtocol = PPoWBlockchainProtocol;
else inheritProtocol = InterfaceBlockchainProtocol;

class MiniBlockchainProtocol extends inheritProtocol{

    constructor(blockchain){
        super(blockchain)
    }

    _validateBlockchainHeader(data){

        InterfaceBlockchainProtocol.prototype._validateBlockchainHeader.call(this, data);

        if (typeof data.header.data.hashAccountantTree === 'string') data.header.data.hashAccountantTree = Serialization.fromBase(data.header.data.hashAccountantTree);
        else data.header.data.hashAccountantTree = new Buffer(data.header.data.hashAccountantTree);

    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        inheritProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        /**
         * Get last K accountant Trees
         */
        socket.on("get/blockchain/accountant-tree/get-accountant-tree", async (data)=>{

            try{

                if (data.height === undefined) data.height = -1;

                if (typeof data.height !== "number")
                    throw "data.height is not a number";

                if (this.blockchain.blocks.length < data.height) throw "height is not valid";
                if (data.height < -1) throw "height is not valid";

                if (this.blockchain.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS > data.height) throw "height is to large for request";

                let serialization = this.blockchain.getSerializedAccountantTree(data.height);

                console.log(colors.yellow("get-accountant-tree data"), serialization);
                socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + (data.height || -1), {
                    result: true,
                    accountantTree: serialization,
                });


            } catch (exception){

                console.log(colors.red("Socket Error - get/blockchain/accountant-tree/get-accountant-tree", exception), data);

                socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + (data.height || -1), {
                    result: false,
                    message: exception.toString()
                });

            }


        });

        /**
         * Get difficulty
         */
        socket.on("get/blockchain/difficulty/get-difficulty", async (data)=>{

            try{

                if (data.height === undefined) data.height = -1;

                if (typeof data.height !== "number")
                    throw "data.height is not a number";

                if (this.blockchain.blocks.length < data.height) throw "height is not valid";
                if (data.height < -1) throw "height is not valid";

                if (this.blockchain.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS > data.height) throw "height is to large for request";

                let serialization = this.blockchain.getDifficultyTarget(data.height);

                console.log(colors.yellow("get-accountant-tree data"), serialization);
                socket.node.sendRequest("get/blockchain/difficulty/get-difficulty/" + (data.height || -1), {
                    result: true,
                    difficulty: serialization,
                });


            } catch (exception){

                console.log(colors.red("Socket Error - get/blockchain/difficulty/get-difficulty", exception), data);

                socket.node.sendRequest("get/blockchain/difficulty/get-difficulty/" + (data.height || -1), {
                    result: false,
                    message: exception.toString()
                });

            }

        });

    }

}

export default MiniBlockchainProtocol