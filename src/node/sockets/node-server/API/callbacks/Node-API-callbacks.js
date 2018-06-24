import NODE_API_TYPE from "../../API-router/NODE_API_TYPE"
import Blockchain from "main-blockchain/Blockchain"

class NodeAPICallbacks{

    constructor(){

        this.subscribers = [];

    }


    addressBalanceSubscribe(req, res, nodeApiType){

        try {

            if (typeof req.address !== "string")  throw {message: "address is invalid"};

            let address = req.address;

            //subscribe to transactions changes
            let data = Blockchain.Balances.subscribeBalancesChanges(address, (data)=>{

                res( {result: true, balances: data.balances } );

            });

            if (data !== null && data.result) {
                let subscription = data.subscription;
                let balances = data.balances;

                return {result: true, address: address, balances: balances};
            } else{

                return {result: false };
            }


        } catch (exception){
            return {result:false, message: exception.message};
        }

    }

    addressTransactionSubscribe(req, res){


        try{

            if (typeof req.address !== "string")  throw {message: "address is invalid"};
            let address = req.address;

            //subscribe to transactions changes
            let data = Blockchain.Transactions.subscribeTransactionsChanges(address, (data)=>{

                res( {result: true, address: address, transaction: data.transaction} );

            });

            if (data !== null && data.result) {
                let subscription = data.subscription;
                let transactions = data.transactions;

                return {result: true, transactions: data.transactions}
            } else {
                return {result: false};
            }


        } catch (exception){
            return {result:false, message: exception.message};
        }


    }


    _subscribeEvent(nodeApiType){


        if (nodeApiType === NODE_API_TYPE.NODE_API_TYPE_SOCKET) {

        } else if (nodeApiType === NODE_API_TYPE.NODE_API_TYPE_HTTP){

        }

    }

}

export default new NodeAPICallbacks()