import ed25519 from "common/crypto/ed25519";
import NodesList from 'node/lists/Nodes-List';
import WebDollarCrypto from "../../../../crypto/WebDollar-Crypto";

class ServerPoolConnectedPoolsProtocol{


    constructor(serverPoolManagement){

        this.serverPoolManagement = serverPoolManagement;
        this.loaded = false;
    }

    startServerPoolConnectedPoolsProtocol(){

        if (this.loaded) return;

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeSocket(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeSocket(NodesList.nodes[i]);


        this.loaded = true;
    }

    _subscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;


        socket.node.on("server-pool/register-pool", async (data) => {

            try {

                if ( typeof data.poolName !== "string" || data.poolName.length <  5) throw {message: "ConnectedPool: poolName is not correct"};
                if ( typeof data.poolFee !== "number" || data.poolFee < 0 || data.poolFee > 100) throw { message: "ConnectedPool: poolFee is not correct" };
                if ( typeof data.poolWebsite !== "string" || data.poolWebsite.length <  5) throw { message: "ConnectedPool: poolWebsite is not correct" };

                if (!Buffer.isBuffer(data.poolPublicKey) || data.poolPublicKey.length < 10) throw { message: "ConnectedPool: poolPublicKey is not correct" };
                if ( typeof data.poolServers !== "object" || data.poolServers === null) throw { message: "ConnectedPool: poolServers is not correct" };

                try{
                    let message = WebDollarCrypto.getBufferRandomValues(32);
                    let answer = await socket.node.sendRequestWaitOnce("server-pool/register-pool/answer", {result: true, serverPoolFee: this.serverPoolManagement.serverPoolSettings.serverPoolFee, messageToSign: message }, "confirmation" );

                    if (answer === null ) throw {message: "Pool Confirmation is null"};
                    if ( answer.result !== true ) throw {message: "Pool Confirmation returned an error ", explanation: answer.message};

                    if (!Buffer.isBuffer(answer.signature) || answer.signature.length <= 5 ) throw {message: "ConnectedPool: Signature is invalid"};

                    if (! ed25519.verify(answer.signature, message, data.poolPublicKey)) throw {message: "ConnectedPool: Signature doesn't validate message"};

                    socket.node.sendRequest("server-pool/register-pool/answer/confirmation/answer", {result: true} );

                    return true;

                } catch (exception){

                    console.error("ConnectedPool: confirmation returned an error", exception);
                    socket.node.sendRequest("server-pool/register-pool/answer/confirmation/answer", {result: false} );

                }


            } catch (exception){

                console.error("ConnectedPool: register-pool returned an error", exception);
                socket.node.sendRequest("server-pool/register-pool/answer", {result: false} );

            }

        });

    }

    _unsubscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }


}

export default ServerPoolConnectedPoolsProtocol;