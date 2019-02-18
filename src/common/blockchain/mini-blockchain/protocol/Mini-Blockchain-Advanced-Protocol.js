import MiniBlockchainProtocol from "./Mini-Blockchain-Protocol"
import BufferExtended from "../../../utils/BufferExtended";
import consts from "consts/const_global"
import GZip from "common/utils/GZip"

class MiniBlockchainAdvancedProtocol extends MiniBlockchainProtocol{

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        MiniBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        /**
         * Get difficulty, accountant Tree for Light Nodes
         */
        socket.node.on("get/blockchain/light/get-light-settings", async (data)=>{

            if (data.height === undefined)
                data.height = -1;

            if (typeof data.height !== "number" ) throw {message: "data.height is not a number"};
            if (data.height < 0) throw {message: "height is not valid"};

            if (this.blockchain.blocks.length < data.height)
                throw {message: "height is not valid"};

            let difficultyTarget = await this.blockchain.getDifficultyTarget(data.height);
            let timestamp = this.blockchain.getTimeStamp(data.height);
            let hashPrev = this.blockchain.getHash(data.height-1);

            socket.node.sendRequest("get/blockchain/light/get-light-settings/" + data.height, {
                result: difficultyTarget ? true : false,
                difficultyTarget: difficultyTarget,
                timeStamp: timestamp,
                hashPrev: hashPrev,
            });

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

        try {
            buffer = gzippedCommunication ? await GZip.unzip(buffer) : buffer;
        } catch (exception){
            gzippedCommunication = false;
        }

        return {
            buffer: buffer,
            gzipped: gzippedCommunication ? buffer : undefined
        };

    }

}

export default MiniBlockchainAdvancedProtocol