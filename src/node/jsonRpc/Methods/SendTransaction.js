import {authenticatedMethod, RpcMethod} from './../../../jsonRpc';
import {isObject, isString, isNumber} from 'lodash';

/**
 * Creates and sign a transaction based on the provided parameters
 */
class SendTransaction extends RpcMethod {
    constructor(name, oTransactionsManager, oWallet, oSyncing) {
        super(name);

        this._oTransactionsManager = oTransactionsManager;
        this._oWallet              = oWallet;
        this._oSyncing             = oSyncing;
    }

    async getHandler(args) {
        if (args.length !== 1 || isObject(args[0]) === false) {
            throw new Error('Params must contain exactly one entry and that entry must be an object');
        }

        const oSyncingStatus = this._oSyncing.getHandler();

        if (oSyncingStatus.isSynchronized === false) {
            throw new Error('Cannot send transaction while node is not in sync');
        }

        const fromAddress = args[0]['from'];
        const toAddress   = args[0].to;
        const value       = args[0].value;
        const fee         = args[0].fee;
        const password    = args[0].password;

        if (isString(fromAddress) === false) {
            throw new Error('From address is invalid. Only string values are supported.');
        }

        try {
            if (await this._oWallet.isAddressEncrypted(fromAddress) && typeof password === 'undefined') {
                throw new Error('Address is encrypted. The password must be provided');
            }
        }
        catch(e) {
            throw new Error(e.message);
        }

        if (isString(toAddress) === false) {
            throw new Error('To address is invalid. Only string value is supported.');
        }

        if (isNumber(value) === false || value <= 0) {
            throw new Error('Value is invalid. Only numerical values greater than 0 are supported.');
        }

        if (typeof fee !== 'undefined' && (isNumber(fee) === false || fee <= 0)) {
            throw new Error('Fee is invalid. Only numerical values greater than 0 are supported.');
        }

        try {
            const aResponse = await this._oTransactionsManager.wizard.createTransactionSimple(
                fromAddress,
                toAddress,
                value,
                fee,
                void 0,
                typeof password === 'undefined' ? void 0 : password.trim().replace(/\s\s+/g, ' ').split(' ')
            );

            if (!aResponse.result) {
                throw new Error(aResponse.message);
            }

            return aResponse.transaction.txId.toString('hex');
        }
        catch (e) {
            throw new Error('Transaction not accepted. ' + e.message);
        }
    }
}

export default authenticatedMethod(SendTransaction);
