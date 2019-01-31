import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended";
import InterfaceBlockchainTransactionsWizard from "./../../transactions/wizard/Interface-Blockchain-Transactions-Wizard"
import InterfaceBlockchainAddressHelper from "../../addresses/Interface-Blockchain-Address-Helper";

class MiningTransactionsSelector{

    constructor(blockchain){

        this.blockchain = blockchain;
        this._transactions = [];

    }

    validateTransactionId(txId){

        //Verify if was included in last blocks
        for(let i=this.blockchain.blocks.length-consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH; i<this.blockchain.blocks.length; i++)
            if( this.blockchain.blocks[i] )
                for(let j=0; j<this.blockchain.blocks[i].data.transactions.transactions.length; j++)
                    if(txId.toString('hex') === this.blockchain.blocks[i].data.transactions.transactions[j].txId.toString('hex'))
                        return false;

        return true;

    }

    validateTransaction(transaction, miningFeePerByte){

        //don't upset the SPAM_GUARDIAN
        for (let j = 0; j < transaction.from.addresses.length; j++) {

            if (this._countAddresses(transaction.from.addresses[j].unencodedAddress, true, false) + 1 > consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_INPUTS)
                throw {message: "too many inputs", from: transaction.from.addresses[j]};

            if ( transaction.from.addresses[j].amount < consts.SETTINGS.MEM_POOL.MINIMUM_TRANSACTION_AMOUNT )
                throw {message: "amount too small"};

        }

        for (let j = 0; j < transaction.to.addresses.length; j++) {

            if (this._countAddresses(transaction.to.addresses[j].unencodedAddress, false, true) + 1 > consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_OUTPUTS)
                throw { message: "too many outputs", from: transaction.to.addresses[j] };

            if ( transaction.to.addresses[j].amount < consts.SETTINGS.MEM_POOL.MINIMUM_TRANSACTION_AMOUNT )
                throw { message: "amount too small" };

        }

        if(!this.validateTransactionId(transaction.txId))
            throw {message: "This transaction was already inserted by txId"};

        if (transaction.nonce < this.blockchain.accountantTree.getAccountNonce(transaction.from.addresses[0].unencodedAddress))
            throw {message: "This transaction was already inserted"};

        if( transaction.timeLock + consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH < this.blockchain.blocks.length )
            throw {message: "transaction is too old"};

        if( transaction.timeLock - consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH > this.blockchain.blocks.length )
            throw {message: "transaction is in future"};

        //validating its own transaction
        if (transaction.from.addresses[0].unencodedAddress.equals( this.blockchain.mining.unencodedMinerAddress ) )
            return true;

        //verify fee
        if (transaction.fee < this.blockchain.transactions.wizard.calculateFeeWizzard( transaction.serializeTransaction(), miningFeePerByte ) )
            throw {message: "fee is too small"};

        return true;

    }

    selectNextTransactions(miningFeePerByte,showLogsOnlyOnce){

        this._transactions = [];
        let missingFirstNonce = false;

        //let size = consts.SETTINGS.PARAMS.MAX_SIZE.BLOCKS_MAX_SIZE_BYTES - 600;
        let size = 200 * 1024 - 800;
        let i = 0;

        while (size > 0 && i < this.blockchain.transactions.pendingQueue.listArray.length ){

            let transaction = this.blockchain.transactions.pendingQueue.listArray[i];

            try {

                if (this._transactions.length.length <= 20)
                    console.log( transaction.txId.toString("hex"), InterfaceBlockchainAddressHelper.generateAddressWIF(transaction.from.addresses[0].unencodedAddress, false, true) );

                if ( !transaction.blockchain ) {
                    i++;
                    continue;
                }

                console.log( transaction.txId.toString("hex"), InterfaceBlockchainAddressHelper.generateAddressWIF(transaction.from.addresses[0].unencodedAddress, false, true), "size", size );

                this.validateTransaction( transaction, miningFeePerByte );

                let bRemoveTransaction = false;

                try {

                    let blockValidationType = {
                        "take-transactions-list-in-consideration": {
                            //validation: true => allows to complex transactions flow
                            //                    like the following: tx1: A=>B,  tx2: B=>C; tx3 C=>D
                            validation: true,
                            transactions: this._transactions,

                            // validation: false,
                            //transactions: [],
                        },
                        "validate-fast-transactions": true,
                    };

                    if ( transaction.validateTransactionEveryTime( this.blockchain.blocks.length,  blockValidationType )) {

                        size -= transaction.serializeTransaction().length;

                        if (size >= 0)
                            this._transactions.push(transaction);

                    } else
                        bRemoveTransaction = true;

                } catch (exception){
                    //console.warn('Error Including Transaction', exception);

                    if(!missingFirstNonce)
                        if( exception.message === 'Nonce is invalid' || exception.message === 'Nonce is not right 2' || exception.message === 'Nonce is not right' ){
                            missingFirstNonce = true;
                            let alreadyInserted = 0;
                            for(let i=this.blockchain.accountantTree.getAccountNonce(transaction.from.addresses[0].unencodedAddress)+1;i<transaction.nonce;i++)
                                if(alreadyInserted<=consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_MISSING_NONCE_SEARCH){
                                    this.blockchain.transactions.pendingQueue.propagateMissingNonce(transaction.from.addresses[0].unencodedAddress,i);
                                    alreadyInserted++;
                                }
                        }

                    bRemoveTransaction = true;
                }

                if (bRemoveTransaction)
                    ; //to nothing

            } catch (exception){

            }

            i++;
        }

        if(showLogsOnlyOnce){
            console.warn("--------------------------------");
            console.warn("pendingQueue", this.blockchain.transactions.pendingQueue.listArray.length);
            console.warn("Transactions selected for mining: ", this._transactions.length);
            console.warn("--------------------------------");
        }

        return this._transactions;
    }

    _countAddresses( unencodedAddress, from=false, to=false){

        let count = 0;

        //safe compare is not necessary

        this._transactions.forEach((transaction)=>{

            if (from)
                transaction.from.addresses.forEach((address)=>{
                    if (address.unencodedAddress.equals( unencodedAddress ))
                        count++;
                });

            if (to)
                transaction.to.addresses.forEach((address)=>{
                    if ( address.unencodedAddress.equals( unencodedAddress ))
                        count++;
                })

        });

        return count;
    }

}

export default MiningTransactionsSelector;