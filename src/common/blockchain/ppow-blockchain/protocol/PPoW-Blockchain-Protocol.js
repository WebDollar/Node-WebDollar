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

    _initializeNodeNiPoPoW(socket){

        socket.node.on("get/nipopow-blockchain/headers/get-proofs/pi/hash",  ()=>{

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

            } catch (exception){

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

                if (this.blockchain.agent.light)
                    proof = this.blockchain.proofPi.getProofHeaders(data.starting, data.length, data.gzipped);
                else  // full node
                    proof = this.blockchain.prover.proofPi.getProofHeaders(data.starting, data.length, data.gzipped);

                console.log("before gzip proof");
                console.log(proof.toString('hex'));
                if (data.gzipped === true) proof = await GZip.zip(proof);
                console.log("after gzip proof");
                console.log(proof.toString('hex'));

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