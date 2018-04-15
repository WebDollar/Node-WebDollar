import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class InterfaceBlockchainTransactionsWizard{

    constructor(transactions, blockchain, wallet, ){

        this.blockchain = blockchain;
        this.transactions = transactions;
        this.wallet = wallet;

    }

    async createTransactionSimple(address, toAddress, toAmount, fee, currencyTokenId, password = undefined, timeLock){

        if (fee === undefined) fee = this.calculateFeeSimple(toAmount);

        try {

            if (typeof toAmount === 'string')
                toAmount = parseInt(toAmount);

        } catch (exception){

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Amount is not a valid number", reason: exception }
        }

        try {
            if (typeof fee ==='string') fee = parseInt(fee);
        } catch (exception){

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Fee is not a valid number", reason: exception }
        }

        try {

            address = this.wallet.getAddress(address);

        } catch (exception){
            console.error("Creating a new transaction raised an exception - Getting Address", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Get Address failed", reason: exception }
        }


        let transaction = undefined;

        try {

            let from = {
                addresses: [
                    {
                        unencodedAddress: address,
                        publicKey: undefined,
                        amount: toAmount +fee
                    }
                ],
                currencyTokenId: currencyTokenId
            };

            let to = {
                addresses: [
                    {
                        unencodedAddress: toAddress,
                        amount: toAmount
                    },
                ]};

            transaction = this.transactions._createTransaction(

                //from
                from,

                //to
                to,
                undefined, //nonce
                timeLock, //timeLock
                undefined, //version
                undefined, //txId
                false, false
            );

        } catch (exception) {
            console.error("Creating a new transaction raised an exception - Failed Creating a transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Failed Creating a transaction", reason: exception }
        }


        let signature;
        try{
            signature = await address.signTransaction(transaction, password);
        } catch (exception){
            console.error("Creating a new transaction raised an exception - Failed Signing the Transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Wrong password", reason: exception }
        }

        try{
            let blockValidationType = {
                "take-transactions-list-in-consideration": {
                    validation: true
                }
            };

            if (!transaction.validateTransactionOnce( this.blockchain.blocks.length-1, blockValidationType ))
                throw {message: "Transaction is invalid"};

        } catch (exception){
            console.error("Creating a new transaction raised an exception - Failed Validating Transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Failed Signing the transaction", reason: exception }
        }

        try{

            this.transactions.pendingQueue.includePendingTransaction(transaction);

        } catch (exception){
            console.error("Creating a new transaction raised an exception - Including Pending Transaction", exception);

            if (typeof exception === "object" && exception.message !== undefined) exception = exception.message;
            return { result:false,  message: "Including Pending Transaction", reason: exception }
        }

        return {
            result: true,
            message: "Your transaction is pending...",
            signature: signature
        }
    }

    calculateFeeSimple(toAmount){

        if (toAmount < 0)
            return 0;

        return  Math.max(
                            Math.min(
                                    Math.floor (0.1 * toAmount) + WebDollarCoins.WEBD,
                                    10*WebDollarCoins.WEBD ),
                            1*WebDollarCoins.WEBD );

    }

}

export default InterfaceBlockchainTransactionsWizard;