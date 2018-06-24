import Blockchain from "main-blockchain/Blockchain"
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import StatusEvents from "common/events/Status-Events"
import NodesList from 'node/lists/Nodes-List';

class NanoWalletProtocol{

    constructor(blockchain){

        this.blockchain = blockchain;
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

        if (socket.node.protocol.connectionType !== CONNECTION_TYPE.CONNECTION_SERVER_SOCKET) return;
        if (socket.node.protocol.nano === undefined || socket.node.protocol.nano.nanoInitialized === true ) return;

        socket.node.protocol.nano = {
            nanoInitialized: true,
        };

        let answer = await socket.node.sendRequestWaitOnce("api/start-subscribers", {}, "answer");

        if (answer !== null && answer.result) {
            socket.node.protocol.pool.subscribedStarted = true;
            this.virtualizeWallet();
        }

    }

    virtualizeWallet(socket){

        if (this.blockchain.agent.consensus) return; //make sure the virtualization was not canceled

        this._sockets.push(socket);

        for (let i=0; i<Blockchain.Wallet.addresses.length; i++)
            this.virtualizeAddress(Blockchain.Wallet.addresses[i].address);

    }

    virtualizeAddress(address){

        for (let i=0; i<this._sockets.length; i++) {

            this._sockets[i].node.sendRequest("subscribe/address/balances", { address: address  });
            this._sockets[i].node.on("subscribe/address/balances/"+address, (data)=>{

                if (this.blockchain.agent.consensus) return; //make sure the virtualization was not canceled

                let prevVal = this.blockchain.accountantTree.getBalance(address);
                if (prevVal=== null ) prevVal = 0;

                this.blockchain.accountantTree.updateAccount(address, data["0x01"] - prevVal );

            });

            this._sockets[i].node.sendRequest("subscribe/address/transactions", { address: address  });
            this._sockets[i].node.on("subscribe/address/transactions/"+address, (data)=>{

                if (this.blockchain.agent.consensus) return; //make sure the virtualization was not canceled

                let transaction = null;
                if (data.transaction !== undefined) transaction = this.blockchain.transactions._createTransaction(data.transaction.from, data.transaction.to, data.transaction.nonce, data.transaction.timeLock, data.transaction.version);

                if (this.blockchain.transactions.pendingQueue.findPendingTransaction(data.txId) === null)
                    transaction.confirmed = data.transaction.confirmed;
                else
                    this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, "all", true)


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