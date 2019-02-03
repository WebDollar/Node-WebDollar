import Blockchain from "main-blockchain/Blockchain"
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import StatusEvents from "common/events/Status-Events"
import NodesList from 'node/lists/Nodes-List';
import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";

/**
 * Nano Wallet which virtualize the consensus using SPV on the Accountant Tree
 */

class NanoWalletProtocol{

    constructor(){

        this._allowConsensus = true;

        this._sockets = [];

        StatusEvents.on('wallet/address-changes',(address)=>{
            this.virtualizeAddress(address.address);
        });

        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject) => { this._disconnectSocked(nodesListObject.socket ) } );

        if (this._allowConsensus)
            this.initializeNanoProtocol();

    }

    initializeNanoProtocolWallet(wallet){

        wallet.emitter.on('wallet/address-changes', (address)=>{
            this.virtualizeAddress(address);
        });

    }

    async initializeNanoProtocol(){

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._initializeSocket(NodesList.nodes[i].socket);

        if (!this._emitterOn) {
            NodesList.emitter.on("nodes-list/connected", (nodesListObject) => this._initializeSocket(nodesListObject.socket));
            this._emitterOn = true;
        }

    }

    async _initializeSocket(socket){

        if ( !this._allowConsensus && Blockchain.agent.consensus)
            return true;

        if ( [NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER,NODES_CONSENSUS_TYPE.NODE_CONSENSUS_POOL].indexOf ( socket.node.protocol.nodeConsensusType) < 0) return;
        if (socket.node.protocol.nano !== undefined && socket.node.protocol.nano.nanoInitialized === true ) return;


        socket.node.protocol.nano = {
            nanoInitialized: true,
        };

        let trySubscribe = async (trials)=>{

            let answer = await socket.node.sendRequestWaitOnce("api/start-subscribers", {}, "answer", 5000);

            if (answer !== null && answer.result) {
                socket.node.protocol.nano.subscribedStarted = true;

                await this.virtualizeWallet(socket);

                return true;
            }

            if (trials > 0)
                return await trySubscribe(trials-1);

        };

        await trySubscribe(10);

    }

    virtualizeWallet(socket){

        if ( !this._allowConsensus && Blockchain.agent.consensus) //make sure the virtualization was not canceled
            return true;

        this._sockets.push(socket);

        for (let i=0; i<Blockchain.Wallet.addresses.length; i++)
            this.virtualizeAddress(Blockchain.Wallet.addresses[i].address, [socket]);

    }

    _subscribeAddress(socket, address){

        return new Promise( async (resolve)=>{

            let trials = 5;

            socket.node.on("api/subscribe/address/balances/answer/"+address, (data)=>{

                try{

                    if ( !this._allowConsensus && Blockchain.agent.consensus) //make sure the virtualization was not canceled
                        return true;

                    if (data === null || !data.result) return false;

                    trials = 0;

                    let prevVal = Blockchain.AccountantTree.getBalance(address);
                    if (prevVal=== null ) prevVal = 0;

                    let currentVal;
                    if (data.balances === null) currentVal = 0;
                    else currentVal = data.balances["0x01"];

                    try {
                        Blockchain.AccountantTree.updateAccount(address, currentVal - prevVal, undefined, undefined, true);
                    } catch (exception){

                    }

                    let prevNonce = Blockchain.AccountantTree.getAccountNonce(address);
                    if (prevNonce === null ) prevNonce = 0;

                    let currentNonce = data.nonce;
                    if (currentNonce === null) currentNonce = 0;

                    try {
                        Blockchain.AccountantTree.updateAccountNonce(address, currentNonce - prevNonce, undefined, undefined, true);
                    } catch (exception){

                    }

                    //TODO use SPV

                    trials = 0;
                    resolve(true);

                } catch (exception){

                }


            });

            while (trials > 0 ){

                let answer = await socket.node.sendRequestWaitOnce("api/subscribe/address/balances", { address: address  }, undefined, 5000);

                if (typeof answer === "object" && answer !== null && answer.result){
                    resolve(true);
                    return;
                }

                trials--;

            }


        });

    }

    _subscribeTransactions(socket, address){

        return new Promise( async (resolve)=>{


            let trials = 5;

            socket.node.on("api/subscribe/address/transactions/answer/"+address, async (data)=>{

                try{

                    if ( !this._allowConsensus && Blockchain.agent.consensus) //make sure the virtualization was not canceled
                        return true;

                    if (data === null || !data.result) return false;

                    trials = 0;

                    let done;

                    for (let k in data.transactions){

                        let transaction = data.transactions[k];
                        let from = transaction.from;

                        //making the transactions valid...

                        from.addresses.forEach( address =>{

                            address.amountPrev = Blockchain.AccountantTree.getAccountNonce(address.address);
                            if (address.amountPrev === null ) address.amountPrev = 0;

                            let currentVal = parseInt(address.amount);

                            try {
                                Blockchain.AccountantTree.updateAccount(address.address, currentVal - address.amountPrev, undefined, undefined, true);
                            } catch (exception){

                            }

                        });


                        transaction.noncePrev = Blockchain.AccountantTree.getAccountNonce(address);
                        if (transaction.noncePrev === null ) transaction.noncePrev = 0;

                        let currentNonce = transaction.nonce;
                        if (currentNonce === null) currentNonce = 0;

                        try {
                            Blockchain.AccountantTree.updateAccountNonce(transaction.from.addresses[0].address, currentNonce - transaction.noncePrev, undefined, undefined, true);
                        } catch (exception){

                        }

                        //TODO use SPV

                        let tx = null;
                        if (transaction ) tx = Blockchain.Transactions._createTransaction( transaction.from, transaction.to, transaction.nonce, transaction.timeLock, transaction.version, undefined);

                        let foundTx = Blockchain.Transactions.pendingQueue.findPendingTransaction( transaction.txId );

                        if ( !foundTx ) {
                            Blockchain.Transactions.pendingQueue.includePendingTransaction(tx, "all");
                            foundTx = transaction;
                        }

                        tx._confirmed = transaction.confirmed;

                        //restore to the original values
                        try{

                            let currentNonce = Blockchain.AccountantTree.getAccountNonce(address);
                            if (currentNonce === null) currentNonce = 0;

                            Blockchain.AccountantTree.updateAccountNonce(transaction.from.addresses[0].address, transaction.noncePrev - currentNonce , undefined, undefined, true);

                            from.addresses.forEach( address =>{

                                let currentVal = Blockchain.AccountantTree.getBalance(address.address);
                                if (currentVal === null) currentVal = 0;

                                Blockchain.AccountantTree.updateAccount(address.address, address.amountPrev - currentVal , undefined, undefined, true);

                            });

                        } catch (exception){

                        }

                        done = true;
                    }

                    if (done)
                        resolve(true);

                } catch (exception){

                }


            });

            while (trials > 0 ){

                let answer = await socket.node.sendRequestWaitOnce("api/subscribe/address/transactions", { address: address  }, undefined, 5000 );

                if (typeof answer === "object" && answer !== null && answer.result){
                    resolve(true);
                    return;
                }

                trials--;

            }



        });

    }

    virtualizeAddress(address, sockets){

        if (sockets === undefined) sockets = this._sockets;

        for (let i=0; i< sockets.length; i++) {

            this._subscribeAddress(sockets[i], address);
            this._subscribeTransactions(sockets[i], address);

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