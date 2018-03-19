import InterfaceBlockchainProtocol from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol'
import Serialization from 'common/utils/Serialization'
import consts from "consts/const_global";
import PPoWBlockchainProtocol from "common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol"

/**
 * MiniBlockchainProtocol only extends the initial Protocol in order to validate the hashAccountantTree
 */

let inheritProtocol;
if (consts.POPOW_PARAMS.ACTIVATED) inheritProtocol = PPoWBlockchainProtocol;
else inheritProtocol = InterfaceBlockchainProtocol;

class MiniBlockchainProtocol extends inheritProtocol{


    _validateBlockchainHeader(data){

        InterfaceBlockchainProtocol.prototype._validateBlockchainHeader.call(this, data);

        if (typeof data.header.data.hashAccountantTree === 'string')
            data.header.data.hashAccountantTree = Serialization.fromBase(data.header.data.hashAccountantTree);
        else
            data.header.data.hashAccountantTree = new Buffer(data.header.data.hashAccountantTree);
    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        inheritProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        /**
         * Get difficulty
         */
        socket.node.on("get/blockchain/light/get-light-settings", async (data)=>{

            try{

                if (data.height === undefined)
                    data.height = -1;

                console.log("get-light-settings111")

                if (typeof data.height !== "number" ) throw {message: "data.height is not a number"};
                if (data.height < 0) throw {message: "height is not valid"};

                if (this.blockchain.blocks.length < data.height)
                    throw {message: "height is not valid"};

                let difficultyTarget = this.blockchain.getDifficultyTarget(data.height);
                let timestamp = this.blockchain.getTimeStamp(data.height);
                let hashPrev = this.blockchain.getHashPrev(data.height);

                socket.node.sendRequest("get/blockchain/light/get-light-settings/" + data.height, {
                    result: difficultyTarget !== null ? true : false,
                    difficultyTarget: difficultyTarget,
                    timeStamp: timestamp,
                    hashPrev: hashPrev,
                });


            } catch (exception){

                console.error("Socket Error - get/blockchain/light/get-light-settings", exception, data);

                socket.node.sendRequest("get/blockchain/light/get-light-settings/" + data.height, {
                    result: false,
                    message: exception
                });

            }

        });


    }

}

export default MiniBlockchainProtocol