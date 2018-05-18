import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'
import InterfaceBlockchainTransaction from "../transactions/transaction/Interface-Blockchain-Transaction";
import Blockchain from "main-blockchain/Blockchain";

class InterfaceBlockchainBlockDataTransactions {

    constructor(blockData, transactions, hashTransactions){

        this.blockData = blockData;
        this.transactions = transactions||[];

        if (hashTransactions === undefined)
            hashTransactions = this.calculateHashTransactions();

        this.hashTransactions = hashTransactions;

    }

    destroyBlockDataTransactions(){

        for (let i=0; i<this.transactions.length; i++) {

            if ( !Blockchain.blockchain.transactions.pendingQueue.findPendingTransaction(this.transactions[i]) )
                this.transactions[i].destroyTransaction();

            this.transactions[i] = undefined;

        }

    }

    validateTransactions(blockHeight, blockValidationType){

        let hashTransactions = this.calculateHashTransactions();

        if (! BufferExtended.safeCompare(this.hashTransactions, hashTransactions))
            throw {message: "hash transaction is invalid at", hashTransactionsOriginal: this.hashTransactions, hashTransactions: hashTransactions, };


        for (let i=0; i<this.transactions.length; i++) {

            if (blockValidationType === undefined) blockValidationType = {};

            blockValidationType['take-transactions-list-in-consideration'] = {
                validation: true,
                transactions: this.transactions.slice(0, i),
            };

            if (!this.transactions[i].validateTransactionOnce(blockHeight, blockValidationType))
                throw {message: "validation failed at transaction", transaction: this.transactions[i]};
        }

        if (!this.validateDuplicateTransactions())
            return {message: "validateDuplicateTransactions failed"};

        return true;
    }

    validateDuplicateTransactions(){

        let fromAddresses = {};
        let toAddresses = {};

        for (let i=0; i<this.transactions.length; i++){
            let transaction = this.transactions[i];

            transaction.from.addresses.forEach((fromAddress)=>{
                let address = fromAddress.unencodedAddress.toString("hex");
                fromAddresses[address]++;

                if ( fromAddresses[address] > consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_INPUTS )
                    throw {message: "spam guardian detected many identical inputs"};

            });

            transaction.to.addresses.forEach((toAddress)=>{

                let address = toAddress.unencodedAddress.toString("hex");
                toAddresses[address]++;

                if ( toAddresses[address] > consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_OUTPUTS )
                    throw {message: "spam guardian detected many identical inputs"};

            });

        }

        return true;
    }

    calculateHashTransactions (){

        if (this.blockData._onlyHeader)
            return this.hashTransactions;
        else
            return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this._computeBlockDataTransactionsConcatenate() ));
    }


    _computeBlockDataTransactionsConcatenate(){

        let bufferList = [];

        for (let i = 0; i < this.transactions.length; i++)
            bufferList.push( this.transactions[i].serializeTransaction() );

        return Buffer.concat( bufferList )

    }

    serializeTransactions(onlyHeader = false){

        let list = [ Serialization.serializeToFixedBuffer( 32, this.hashTransactions ) ];

        if ( !onlyHeader  && !this.blockData._onlyHeader ) {
            list.push(Serialization.serializeNumber4Bytes(this.transactions.length));

            for (let i = 0; i < this.transactions.length; i++)
                list.push(this.transactions[i].serializeTransaction());
        }

        return Buffer.concat(list);
    }


    deserializeTransactions(buffer, offset, onlyHeader = false){

        this.hashTransactions = BufferExtended.substr(buffer, offset, 32 );
        offset += 32;

        if (!onlyHeader && !this.blockData._onlyHeader) {

            let length = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, 4)); //TODO change  2 elements
            offset += 4 ;

            for (let i = 0; i < length; i++) {

                let answer = this.blockData.blockchain.transactions._createTransactionFromBuffer(buffer, offset);

                let transaction = answer.transaction;
                offset = answer.offset;

                this.transactions.push(transaction);
            }
        }

        return offset;
    }

    _processBlockDataTransaction(blockHeight, transaction, multiplicationFactor = 1 , minerAddress = undefined, revertActions = undefined ){

        //skipping checking the Transaction in case it requires reverting
        if (multiplicationFactor === 1) {
            if (!transaction.validateTransactionOnce(blockHeight))
                throw {message: "couldn't process the transaction ", transaction: transaction.txId };
        }

        transaction.processTransaction(multiplicationFactor, minerAddress, revertActions );

        return true;

    }

    processBlockDataTransactions( block, multiplicationFactor = 1, revertActions){

        for (let i=0; i<block.data.transactions.transactions.length; i++)
            if (! this._processBlockDataTransaction( block.height, block.data.transactions.transactions[i], multiplicationFactor, block.data.minerAddress, revertActions ) )
                return false;

        return true;
    }

    calculateFees(){

        let fee = 0;
        for (let i=0; i < this.transactions.length; i++)
            fee += this.transactions[i].fee;

        return fee;
    }

}

export default InterfaceBlockchainBlockDataTransactions;