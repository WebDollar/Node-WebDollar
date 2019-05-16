/* eslint-disable */
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import MiniBlockchainTransactions from "./../../../mini-blockchain/transactions/trasanction/Mini-Blockchain-Transaction"
import NodesList from 'node/lists/Nodes-List';
import consts from 'consts/const_global'

class InterfaceBlockchainTransactionsWizard{

    constructor(transactions, blockchain, wallet, ){

        this.blockchain = blockchain;
        this.transactions = transactions;
        this.wallet = wallet;

    }

    async deserializeValidateTransaction(transaction){

        let myTransaction = new MiniBlockchainTransactions(this.blockchain,undefined,undefined,0,undefined,undefined,undefined,false,false,false,false,false,false);

        await myTransaction.deserializeTransaction(transaction.data,0,true);

        return myTransaction;

    }

    async createWizardTransactionSimple(address, toAddress, toAmount, fee, currencyTokenId, password = undefined, timeLock, nonce, skipValidationNonce, propagateTransaction = true ){

        let process = await this._createWizardTransaction( [{
            address,
            to: [{
                unencodedAddress: toAddress,
                amount: toAmount,
            }],
            fee,
            currencyTokenId,
            password,
            timeLock,
            nonce
        }], skipValidationNonce );

        if ( propagateTransaction && process.result)
            return this.propagateTransaction( process.signature , process.transaction );

        return process;

    }

    async _createWizardTransaction( txData, skipValidationNonce=false){

        const feeFound = !!txData[0].fee;

        for (let from of txData){
            if (from.fee === undefined && feeFound) return {result: false, message: "You either specify the fee or not"};
            if (!from.fee && feeFound) return {result: false, message: "You either specify the fee or not"};
        }

        //validation
        for (let from of txData ){

            for (let to of from.to) {

                try {

                    if (typeof to.amount === 'string') to.amount = parseInt( to.amount );

                } catch (exception) {

                    if (typeof exception === "object" && exception.message !== undefined)
                        exception = exception.message;

                    return {result: false, message: "Amount is not a valid number", reason: exception}
                }
            }

            try {

                if (typeof from.fee === 'string') from.fee = parseInt(from.fee);

            } catch (exception) {

                if (typeof exception === "object" && exception.message !== undefined)
                    exception = exception.message;

                return {result: false, message: "Fee is not a valid number", reason: exception}
            }

            try {

                from.address = this.wallet.getAddress(from.address);

            } catch (exception) {

                console.error("Creating a new transaction raised an exception - Getting Address", exception);

                if (typeof exception === "object" && exception.message !== undefined)
                    exception = exception.message;

                return {result: false, message: "Get Address failed", reason: exception}

            }


        }

        //create txFrom
        let txFrom = {
            addresses: [],
            currencyTokenId: txData.currencyTokenId,
        };

        for (let from of txData ) {

            from.toAmountTotal = 0;

            for (let to of from.to)
                from.toAmountTotal += to.amount;

            txFrom.addresses.push({
                addresses: [{
                    unencodedAddress: from.address,
                    publicKey: undefined,
                    amount: from.toAmountTotal + (from.fee||0)
                }]
            });

        }

        //create txTo
        let txTo = [];
        for (let from of txData )
            for (let to of from.to){
                txTo.push({
                    unencodedAddress: to.unencodedAddress,
                    amount: to.amount,
                });
            }

        let transaction = undefined;

        try {

            transaction = await this.transactions._createTransaction(

                txFrom, //from
                txTo, //to
                txData.nonce, //nonce
                txData.timeLock, //timeLock
                undefined, //version @FIXME This is not calculated if validateVersion === false,
                undefined, //txId
                false, false, true, true, true, false,
            );

        } catch (exception) {
            console.error("Creating a new transaction raised an exception - Failed Creating a transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;

            return { result:false,  message: "Failed Creating a transaction", reason: exception }
        }

        //calculate the fee
        if (!feeFound) {

            let initialFee = this.calculateFeeWizzard( transaction._serializeTransaction({} )) ;

            for (let i=0; i < txData.length; i++){

                let specifyOutputs = {};
                specifyOutputs[i] = true;

                let outFee = this.calculateFeeWizzard( transaction._serializeTransaction(specifyOutputs )) ;
                transaction.from.addresses[0].amount += Math.ceil( initialFee / txData.length) + outFee;

            }

            // This is needed because the fromAmount is changing
            transaction.serializeTransaction(true);
        }

        let signatures = [];
        for (let from of txData){


            try{
                let signature = await from.address.signTransaction( transaction, txData.password );
                signatures.push(signature);
            } catch (exception){
                console.error("Creating a new transaction raised an exception - Failed Signing the Transaction", exception);

                if (typeof exception === "object" && exception.message ) exception = exception.message;
                return { result:false,  message: "Wrong password", reason: exception }
            }

        }

        try{

            if (!skipValidationNonce){

                let blockValidationType = {
                    "take-transactions-list-in-consideration": {
                        validation: true
                    }
                };

                if (!transaction.validateTransactionOnce( this.blockchain.blocks.length-1, blockValidationType ))
                    throw {message: "Transaction is invalid"};

            }

        } catch (exception){
            console.error("Creating a new transaction raised an exception - Failed Validating Transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Failed Signing the transaction", reason: exception }
        }

        return {

            result: true,
            transaction: transaction,
            signature: signatures.length === 1 ? signatures[0] : signatures,

        };

    }

    async propagateTransaction(signature,transaction){

        try{

            await this.transactions.pendingQueue.includePendingTransaction(transaction);

        } catch (exception){
            console.error("Creating a new transaction raised an exception - Including Pending Transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Including Pending Transaction", reason: exception }
        }

        return {
            result: true,
            message: "Your transaction is pending...",
            signature: signature,
            transaction: transaction,
        }

    }

    calculateFeeWizzard(serialization, webdPerByte){

        if (webdPerByte === undefined)
            webdPerByte = consts.MINING_POOL.MINING.FEE_PER_BYTE;

        // let factor = Math.trunc( serialization.length / 230 ) + 1;
        // webdPerByte = factor * webdPerByte;

        return serialization.length * webdPerByte;

    }

    calculateFeeSimple(){
        return this.calculateFeeWizzard( new Buffer(141) );
    }

}

export default InterfaceBlockchainTransactionsWizard;
