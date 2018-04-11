import InterfaceBlockchainProtocol from "common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol"
import PPoWBlockchainProofPi from "./../blockchain/prover/PPoW-Blockchain-Prover"

class PPoWBlockchainProtocol extends InterfaceBlockchainProtocol{

    _initializeNewSocket(nodesListObject) {

        InterfaceBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        let socket = nodesListObject.socket;

        this._initializeNodeNiPoPoW(socket);

    }

    _initializeNodeNiPoPoW(socket){

        socket.node.on("get/nipopow-blockchain/get-proofs/pi/headers", async ()=>{

            socket.node.sendRequest("get/nipopow-blockchain/get-proofs/pi/headers", this.blockchain.prover.proofPi.getProofHeaders() );

        });

        socket.node.on("get/nipopow-blockchain/get-proofs/xi/headers", async ()=>{

            socket.node.sendRequest("get/nipopow-blockchain/get-proofs/pi/headers", this.blockchain.prover.proofXi.getProofHeaders() );

        });

    }

}


export default PPoWBlockchainProtocol;