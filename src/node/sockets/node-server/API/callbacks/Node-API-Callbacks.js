import NODE_API_TYPE from "../../API-router/NODE_API_TYPE"
import Blockchain from "main-blockchain/Blockchain"
import NodesList from 'node/lists/Nodes-List';

class NodeAPICallbacks{

    constructor(){

        /**
         *
         * {
         *    name
         *    callback
         * }
         */
        this._subscribers = [];

        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject ) => { this._disconnectCallbacks(nodesListObject.socket, false ) });


    }


    addressBalancesSubscribe(req, res, callback, nodeApiType){

        let address;

        try {

            if (typeof req.address !== "string")  throw {message: "address is invalid"};

            address = req.address;

            //subscribe to transactions changes
            let data = Blockchain.Balances.subscribeBalancesChanges(address, (data)=>{

                callback( {result: true, balances: data.balances, nonce: data.nonce, _suffix: address } );

            });

            if (data === null || !data.result) throw {message: "couldn't subscribe"};

            let unsubscribe = data.subscription;
            let balances = data.balances;
            let nonce = data.nonce;

            this._addSubscribedEvent(unsubscribe, "addressBalancesSubscribe"+address, res, callback, nodeApiType);

            return {result: true, address: address, balances: balances, nonce: nonce,  _suffix: address};


        } catch (exception){
            return {result:false, message: exception.message, _suffix: address};
        }

    }

    addressBalanceUnsubscribe(req, res, callback, nodeApiType){

        let address;
        try {

            if (typeof req.address !== "string")  throw {message: "address is invalid"};
            address = req.address;

            this.removeCallback("addressBalancesSubscribe" + address, res);

            return {result:true, _suffix: address};

        } catch (exception){
            return {result:false, message: exception.message, _suffix: address||''};
        }

    }


    addressTransactionsSubscribe(req, res, callback, nodeApiType){

        let address;

        try{

            if (typeof req.address !== "string")  throw {message: "address is invalid"};
            address = req.address;

            //subscribe to transactions changes
            let data = Blockchain.Transactions.subscribeTransactionsChanges(address, (data)=>{

                callback( {result: true, address: address, transaction: data.transaction, _suffix: address} );

            });

            if (data === null || !data.result) throw {message: "couldn't subscribe"};

            let subscription = data.subscription;

            this._addSubscribedEvent(subscription, "addressTransactionsSubscribe"+address, res, callback, nodeApiType);

            return {result: true, transactions: data.transactions, _suffix: address}


        } catch (exception){
            return {result:false, message: exception.message, _suffix: address || ''};
        }


    }

    addressTransactionsUnsubscribe(req, res, callback, nodeApiType){

        let address;
        try {
            if (typeof req.address !== "string")  throw {message: "address is invalid"};
            address = req.address;

            this.removeCallback("addressTransactionsSubscribe" + address, res);

            return {result:true, _suffix: address};
        } catch (exception){
            return {result:false, message: exception.message, _suffix: address||''};
        }

    }


    _addSubscribedEvent(unsubscribe, name, res, nodeApiType){

        let object = {
            unsubscribe: unsubscribe,
            name: name,
            nodeApiType: nodeApiType,
        };

        if (nodeApiType === NODE_API_TYPE.NODE_API_TYPE_SOCKET)
            object.res = res;

        this._subscribers.push(object);

    }

    removeCallback(name, callback ){

        for (let i=this._subscribers.length-1; i>=0; i--)
            if (this._subscribers[i].name === name && this._subscribers[i].res === callback  ){
                this._subscribers[i].unsubscribe();
                this._subscribers.splice(i,1);
            }

    }

    _disconnectCallbacks(socket){

        for (let i=this._subscribers.length-1; i>=0; i-- )
            if (this._subscribers[i].res === socket){
                this._subscribers[i].unsubscribe();
                this._subscribers.splice(i, 1);
            }

    }

}

export default new NodeAPICallbacks()