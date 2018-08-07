import MiniBlockchainProtocol from "./Mini-Blockchain-Protocol"
import BufferExtended from "../../../utils/BufferExtended";
import consts from "consts/const_global"
import GZip from "common/utils/GZip"

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

                let gzipped = data.gzipped || false;

                let serialization = this.blockchain.getSerializedAccountantTree( data.height , gzipped );

                let moreChunks = false;

                if (typeof data.substr === "object" && data.substr !== null) {

                    if (typeof data.substr.startIndex === "number" && typeof data.substr.count === "number") {

                        if (data.substr.count < consts.SETTINGS.PARAMS.MAX_SIZE.MINIMUM_SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES) throw {message:"way to few messages"};


                        if ((serialization.length - data.substr.startIndex) > data.substr.count)
                            moreChunks = true;
                        else
                            moreChunks = false;

                        if (serialization.length - 1 - data.substr.startIndex > 0)
                            serialization = BufferExtended.substr(serialization, data.substr.startIndex, Math.min(data.substr.count, serialization.length  - data.substr.startIndex));
                        else
                            serialization = new Buffer(0);

                        return socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + data.height, {
                            result: true,
                            accountantTree: serialization,
                            moreChunks: moreChunks,
                            gzipped: gzipped,
                        });
                        
                    }

                } else {
                    return socket.node.sendRequest("get/blockchain/accountant-tree/get-accountant-tree/" + data.height, {
                        result: true,
                        accountantTree:serialization,
                        gzipped: gzipped,
                    }); 
                }


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

    async getAccountantTree( socket, height, timeoutCount = 1000 ){

        let downloading = true;
        let pos = 0;
        let buffers = [];
        let gzippedCommunication = false;

        //can not be more than 1000
        while (downloading && pos < timeoutCount) {

            let answer = await socket.node.sendRequestWaitOnce("get/blockchain/accountant-tree/get-accountant-tree", {
                    height: height,

                    substr: {
                        startIndex: pos * consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES,
                        count: consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES,
                    },

                    gzipped: consts.BLOCKCHAIN.LIGHT.GZIPPED ? true : undefined,

                },

                height, 10000);

            if (answer === null) throw {message: "get-accountant-tree never received ", forkStartingHeight: height};
            if (!answer.result) throw {message: "get-accountant-tree return false ", answer: answer.message };

            if ( !Buffer.isBuffer(answer.accountantTree) )
                throw {message: "accountantTree data is not a buffer"};

            if (gzippedCommunication===false && answer.gzipped===true) gzippedCommunication=true;

            if (answer.accountantTree.length === consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES ||
                (answer.accountantTree.length <= consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES && !answer.moreChunks))
            {

                buffers.push(answer.accountantTree);

                if (!answer.moreChunks)
                    downloading = false;

            }

            pos++;

        }

        if (pos === timeoutCount)
            throw {message: "accountantTree too many trials"};

        if (buffers.length === 0)
            throw {message: "accountantTree is empty"};

        let buffer = Buffer.concat(buffers);

        //console.log("Before ungziped");
        //console.log(buffer.toString('hex'));

        if (gzippedCommunication) buffer = await GZip.unzip(buffer);

        //console.log("After ungziped");
        //console.log(buffer.toString('hex'));

        return buffer;

    }

}

export default MiniBlockchainAdvancedProtocol