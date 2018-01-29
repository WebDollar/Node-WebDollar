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

        this.MAX_ACCOUNTANT_TREE_BLOCK_DIFFERENCE = 100;

    }

    _validateBlockchainHeader(data){

        InterfaceBlockchainProtocol.prototype._validateBlockchainHeader.call(this, data);

        if (typeof data.header.data.hashAccountantTree === 'string') data.header.data.hashAccountantTree = Serialization.fromBase(data.header.data.hashAccountantTree);
        else data.header.data.hashAccountantTree = new Buffer(data.header.data.hashAccountantTree);

    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        inheritProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        socket.on("get/blockchain/accountant-tree/get-accountant-tree", async (data)=>{

            try{

                if (data.height === undefined) data.height = -1;

                if (typeof data.height !== "number")
                    throw "data.height is not a number";


            } catch (exception){

                console.log(colors.red("Socket Error - get/blockchain/accountant-tree/get-accountant-tree", exception), data);

                socket.node.sendRequest("blockchain/header/new-block/answer/" + data.height || 0, {
                    result: false,
                    message: exception.toString()
                });

            }


        });

    }

}

export default MiniBlockchainProtocol