import MiniBlockchainProtocol from "./Mini-Blockchain-Protocol"

class MiniBlockchainAdvancedProtocol extends MiniBlockchainProtocol{


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
                    throw {message: "data.height is not a number"};

                if (this.blockchain.blocks.length < data.height)
                    throw {message: "height is not valid"};

                if (data.height < -1)
                    throw {message: "height is not valid"};

                let serialization = this.blockchain.getSerializedAccountantTree(data.height);

                //console.log("get/blockchain/accountant-tree/get-accountant-tree", serialization.toString("hex"))

                socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + data.height, {
                    result: true,
                    accountantTree: serialization,
                });


            } catch (exception){

                console.error("Socket Error - get/blockchain/accountant-tree/get-accountant-tree", exception, data);

                socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + data.height, {
                    result: false,
                    message: exception
                });

            }


        });

        /**
         * Get difficulty, accountant Tree for Light Nodes
         */
        socket.node.on("get/blockchain/light/get-light-settings", async (data)=>{

            try{

                if (data.height === undefined)
                    data.height = -1;

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

export default MiniBlockchainAdvancedProtocol