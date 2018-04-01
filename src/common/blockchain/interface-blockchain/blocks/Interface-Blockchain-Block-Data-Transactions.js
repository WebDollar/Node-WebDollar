import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'
import InterfaceBlockchainTransaction from "../transactions/transaction/Interface-Blockchain-Transaction";

class InterfaceBlockchainBlockDataTransactions {

    constructor(blockData, transactions, hashTransactions){

        this.blockData = blockData;
        this.transactions = transactions||[];

        if (hashTransactions === undefined)
            hashTransactions = this.calculateHashTransactions();

        this.hashTransactions = hashTransactions;


    }

    validateTransactions(blockHeight, blockValidationType){

        let hashTransactions = this.calculateHashTransactions();
        if (!this.hashTransactions.equals(hashTransactions))
            throw {message: "hash transaction is invalid at", hashTransactionsOriginal: this.hashTransactions, hashTransactions: hashTransactions, };

        for (let i=0; i<this.transactions.length; i++) {

            if (blockValidationType === undefined) blockValidationType = {};

            blockValidationType['take-transactions-list-in-consideration'] = {
                validation: true,
                transactions: this.transactions.slice(0, i-1),
            };

            if (!this.transactions[i].validateTransactionOnce(blockHeight, blockValidationType))
                throw {message: "validation failed at transaction", transaction: this.transactions[i]};
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

    _processBlockDataTransaction(blockHeight, transaction, multiplicationFactor = 1 , minerAddress = undefined ){

        try {

            //skipping checking the Transaction in case it requires reverting
            if (multiplicationFactor === 1) {
                if (!transaction.validateTransactionOnce(blockHeight))
                    throw {message: "couldn't process the transaction ", transaction: transaction};
            }

            transaction.processTransaction (multiplicationFactor);

            transaction.processTransactionFees(multiplicationFactor, minerAddress);

            return true;
        } catch (exception){
            console.error("couldn't process the transaction ", transaction, exception);
            return false;
        }
    }

    processBlockDataTransactions(block, multiplicationFactor = 1){

        let i;
        for (i=0; i<block.data.transactions.transactions.length; i++)
            if ( ! this._processBlockDataTransaction(block.height, block.data.transactions.transactions[i], multiplicationFactor, block.data.minerAddress))
                return i-1;

        return block.data.transactions.transactions.length-1;
    }

    processBlockDataTransactionsRevert(endPos, startPos, block, multiplicationFactor = -1){

        let i;
        for (i = endPos; i >= startPos; i--)
            if (i >= 0)
                if ( ! this._processBlockDataTransaction(block.height, block.data.transactions.transactions[i], multiplicationFactor, block.data.minerAddress))
                    return i;

        return i;

    }


}

export default InterfaceBlockchainBlockDataTransactions;