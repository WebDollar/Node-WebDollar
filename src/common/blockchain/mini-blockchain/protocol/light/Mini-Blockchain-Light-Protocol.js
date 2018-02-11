const colors = require('colors/safe');
import MiniBlockchainProtocol from "../Mini-Blockchain-Protocol";
import MiniBlockchainLightProtocolForkSolver from "./Mini-Blockchain-Light-Protocol-Fork-Solver"
import consts from 'consts/const_global'

class MiniBlockchainLightProtocol extends MiniBlockchainProtocol{


    createForkSolver(){
        this.forkSolver = new MiniBlockchainLightProtocolForkSolver(this.blockchain, this);
    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        MiniBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        /**
         * Get last K accountant Trees
         */
        socket.node.on("get/blockchain/accountant-tree/get-accountant-tree", async (data)=>{

            try{

                if (data.height === undefined) data.height = -1;

                if (typeof data.height !== "number")
                    throw "data.height is not a number";

                if (this.blockchain.blocks.length < data.height) throw "height is not valid";
                if (data.height < -1) throw "height is not valid";

                let serialization = this.blockchain.getSerializedAccountantTree(data.height);

                console.log("get/blockchain/accountant-tree/get-accountant-tree", serialization.toString("hex"))

                socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + data.height, {
                    result: true,
                    accountantTree: serialization,
                });


            } catch (exception){

                console.log(colors.red("Socket Error - get/blockchain/accountant-tree/get-accountant-tree", exception), data);

                socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + data.height, {
                    result: false,
                    message: exception.toString()
                });

            }


        });
    }

}

export default MiniBlockchainLightProtocol