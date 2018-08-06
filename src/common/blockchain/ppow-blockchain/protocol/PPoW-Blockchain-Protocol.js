import InterfaceBlockchainProtocol from "common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol"
import PPoWBlockchainProtocolForksManager from "./PPoW-Blockchain-Protocol-Forks-Manager"
import GZip from "common/utils/GZip"

class PPoWBlockchainProtocol extends InterfaceBlockchainProtocol{

    createForksManager(){
        this.forksManager = new PPoWBlockchainProtocolForksManager( this.blockchain, this );
    }

    _initializeNewSocket(nodesListObject) {

        InterfaceBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        let socket = nodesListObject.socket;

        this._initializeNodeNiPoPoW(socket);

    }

    _initializeNodeNiPoPoW(socket) {

        socket.node.on("get/nipopow-blockchain/headers/get-proofs/pi-gzip-supported", () => {

            socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/pi-gzip-supported" + "/answer", {result: true});

        });

        socket.node.on("get/nipopow-blockchain/headers/get-proofs/pi/hash", () => {

            try {

                let answer;

                if (this.blockchain.agent.light)
                    answer = {
                        hash: this.blockchain.proofPi.hash,
                        length: this.blockchain.proofPi.blocks.length
                    };
                else  // full node
                    answer = {
                        hash: this.blockchain.prover.proofPi.hash,
                        length: this.blockchain.prover.proofPi.blocks.length
                    };

                socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/pi/hash" + "/answer", answer);

            } catch (exception) {

            }

        });

        socket.node.on("get/nipopow-blockchain/headers/get-proofs/pi-gzip", async (data)=>{

            try {

                let serialization;

                if (this.blockchain.agent.light)
                    serialization = this.blockchain.proofPi.proofGzip;
                else  // full node
                    serialization = this.blockchain.prover.proofPi.proofGzip;

                let moreChunks = false;

                if (typeof data === "object" && data !== null) {

                    if (typeof data.starting === "number" && typeof data.length === "number") {

                        if (data.length < consts.SETTINGS.PARAMS.MAX_SIZE.MINIMUM_SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES) throw {message: "way to few messages"};

                        if ((serialization.length - data.starting) > data.length)
                            moreChunks = true;
                        else
                            moreChunks = false;

                        if (serialization.length - 1 - data.starting > 0)
                            serialization = BufferExtended(serialization, data.starting, Math.min(data.length, serialization.length - data.starting));
                        else
                            serialization = new Buffer(0);

                        return socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/pi-gzip", {
                            result: true,
                            data: serialization,
                            moreChunks: moreChunks,
                        });

                    }

                }

            } catch (exception) {

                console.error("Socket Error - get/nipopow-blockchain/headers/get-proofs/pi-gzip", exception, data);

                socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/pi-gzip",{
                    result: false,
                    message: exception
                });

            }

        });

        socket.node.on("get/nipopow-blockchain/headers/get-proofs/pi", async (data)=>{

            try {

                if (data.starting === undefined) data.starting = 0;
                if (data.length === undefined) data.length = 1000;
                if (data.gzipped === undefined) data.gzipped = false;

                if (typeof data.starting !== "number") throw "starting is not a number";
                if (typeof data.length !== "number") throw "length is not a number";

                let proof;

                if (this.blockchain.agent.light) {

                    proof = this.blockchain.proofPi.getProofHeaders(data.starting, data.length);

                }
                else { // full node

                    proof = this.blockchain.prover.proofPi.getProofHeaders(data.starting, data.length);

                }

                socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/pi" + "/answer", {result:true, data: proof});

            } catch (exception){

                console.error("Error getting proofs headers", exception);

            }

        });

        socket.node.on("get/nipopow-blockchain/headers/get-proofs/xi", async ()=>{

            //socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/xi"+"/answer", this.blockchain.prover.proofXi.getProofHeaders() );

        });

    }

}


export default PPoWBlockchainProtocol;