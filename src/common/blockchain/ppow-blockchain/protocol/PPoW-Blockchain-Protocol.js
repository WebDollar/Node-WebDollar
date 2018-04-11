import InterfaceBlockchainProtocol from "common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol"

class PPoWBlockchainProtocol extends InterfaceBlockchainProtocol{

    _initializeNewSocket(nodesListObject) {

        InterfaceBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject);

        let socket = nodesListObject.socket;

    }

    _initializeFullNodeNiPoPoW(socket){

        socket.node.on("get/nipopow-blockchain/get-proof", async (data)=>{

            let proof = this.blockchain.createProve( this.blockchain );

        });

    }



}


export default PPoWBlockchainProtocol;