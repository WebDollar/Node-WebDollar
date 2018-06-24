import Blockchain from "main-blockchain/Blockchain"
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import StatusEvents from "common/events/Status-Events"
import NodesList from 'node/lists/Nodes-List';
import NODES_CONSENSUS_TYPE from "../../../../../node/lists/types/Node-Consensus-Type";

class NanoWalletProtocol{

    constructor(){

        this._sockets = [];

        StatusEvents.on('wallet/address-changes',(address)=>{
            this.virtualizeAddress(address.address);
        });

        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject) => { this._disconnectSocked(nodesListObject.socket ) } );

    }

    async initializeNanoProtocol(){

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._initializeSocket(NodesList.nodes[i].socket);

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => { this._initializeSocket(nodesListObject.socket ) } );

    }

    async _initializeSocket(socket){

        if ( [NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER,NODES_CONSENSUS_TYPE.NODE_CONSENSUS_POOL].indexOf ( socket.node.protocol.nodeConsensusType) < 0) return;
        if (socket.node.protocol.nano !== undefined && socket.node.protocol.nano.nanoInitialized === true ) return;

        socket.node.protocol.nano = {
            nanoInitialized: true,
        };

        let answer = await socket.node.sendRequestWaitOnce("api/start-subscribers", {}, "answer");

        if (answer !== null && answer.result) {
            socket.node.protocol.nano.subscribedStarted = true;
            this.virtualizeWallet(socket);
        }

    }

    virtualizeWallet(socket){

        if (Blockchain.Agent.consensus) return; //make sure the virtualization was not canceled

        this._sockets.push(socket);

        for (let i=0; i<Blockchain.Wallet.addresses.length; i++)
            this.virtualizeAddress(Blockchain.Wallet.addresses[i].address);

    }

    virtualizeAddress(address){

        for (let i=0; i<this._sockets.length; i++) {

            this._sockets[i].node.sendRequest("api/subscribe/address/balances", { address: address  });
            this._sockets[i].node.on("api/subscribe/address/balances/answer/"+address, (data)=>{

                if (Blockchain.Agent.consensus) return; //make sure the virtualization was not canceled

                if (data === null || !data.result) return false;

                let prevVal = Blockchain.AccountantTree.getBalance(address);
                if (prevVal=== null ) prevVal = 0;

                let currentVal;
                if (data.balances === null) currentVal = 0;
                else currentVal = data.balances["0x01"];


                Blockchain.AccountantTree.updateAccount(address, currentVal - prevVal, undefined, undefined, true );

            });

            this._sockets[i].node.sendRequest("api/subscribe/address/transactions", { address: address  });
            this._sockets[i].node.on("api/subscribe/address/transactions/answer/"+address, (data)=>{

                if (Blockchain.Agent.consensus) return; //make sure the virtualization was not canceled

                if (data === null || !data.result) return false;

                for (let k in data.transactions){

                    let transaction = data.transactions[k];

                    if (data === null || !data.result) return false;

                    let tx = null;
                    if (transaction !== undefined) tx = Blockchain.Transactions._createTransaction(transaction.from, transaction.to, transaction.nonce, transaction.timeLock, transaction.version);

                    let foundTx = Blockchain.Transactions.pendingQueue.findPendingTransaction(data.txId);

                    if ( foundTx !== null)
                        foundTx .confirmed = transaction.confirmed;
                    else
                        Blockchain.Transactions.pendingQueue.includePendingTransaction(tx, "all", true)

                }


            });

        }
    }

    _disconnectSocked(socket){

        for (let i=this._sockets.length-1; i>= 0; i--)
            if (this._sockets[i] === socket){
                this._sockets.splice(i,1);
            }

    }

}

export default new NanoWalletProtocol();