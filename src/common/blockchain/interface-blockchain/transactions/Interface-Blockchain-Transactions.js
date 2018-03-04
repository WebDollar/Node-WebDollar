import consts from 'consts/const_global'
import InterfaceTransactionsPendingQueue from './pending/Interface-Transactions-Pending-Queue'
import InterfaceTransactionsUniqueness from './uniqueness/Interface-Transactions-Uniqueness'
import InterfaceTransaction from "./transaction/Interface-Blockchain-Transaction"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class InterfaceBlockchainTransactions {

    constructor( wallet ){

        this.wallet = wallet;

        let db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.TRANSACTIONS_DATABASE);

        this.pendingQueue = new InterfaceTransactionsPendingQueue(db);

        //this.uniqueness = new InterfaceTransactionsUniqueness(db);
    }

    createTransactionSimple(address, toAddress, toAmount, fee, currency){

        let transaction = new InterfaceTransaction( undefined , { address: toAddress, amount: toAmount}, undefined, undefined, undefined);

        address = this.wallet.getAddress(address);

        let publicKey = address.getPublicKey(undefined);

        transaction.from.setFrom( {address: address, publicKey: publicKey }, currency );
        transaction.to.setTo( {address: toAddress, amount: toAddress}, fee);

        this.pendingQueue.includePendingTransaction(transaction);

    }

    calculateFeeSimple(toAmount){

        if (toAmount < 0)
            return 0;

        return Math.min( Math.floor(0.1 * toAmount) + 1, 10);

    }


    /**
     * @param address
     * @param password
     * @returns {Promise<boolean>}
     */
    async signTransaction(address, password, transaction){

        address = this.wallet.getAddress(address);
        if (address === null)
            throw "address not found";

        let privateKey;

        if (await this.wallet.isAddressEncrypted(address)) {
            privateKey = await address.getPrivateKey(password);
        } else
            privateKey = await address.getPrivateKey(undefined);

        //TODO: Sign transaction code
        return true;
    }



}

export default InterfaceBlockchainTransactions;