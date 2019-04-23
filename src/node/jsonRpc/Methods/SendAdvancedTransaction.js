import { isArray, isObject, isString, isNumber } from 'lodash';
import { authenticatedMethod, RpcMethod }        from './../../../jsonRpc';
import constGlobal                               from './../../../consts/const_global';
import InterfaceBlockchainAddressHelper          from './../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

/**
 * Creates and sign an advanced transaction based on the provided parameters
 */
class SendAdvancedTransaction extends RpcMethod {
    constructor(name, oTransactionsManager, oWallet, oSyncing, oAddressBalanceProvider) {
        super(name);

        this._oTransactionsManager    = oTransactionsManager;
        this._oWallet                 = oWallet;
        this._oSyncing                = oSyncing;
        this._oAddressBalanceProvider = oAddressBalanceProvider;
    }

    async getHandler(args) {
        if (args.length !== 2 || isArray(args[0]) === false || isArray(args[1]) === false) {
            throw new Error('Params must contain exactly two entries and those entries must be of type Array');
        }

        const oSyncingStatus = this._oSyncing.getHandler();

        if (oSyncingStatus.isSynchronized === false) {
            throw new Error('Cannot send transaction while node is not in sync');
        }

        // @TODO update this method to support multiple inputs
        if (args[0].length !== 1) {
            throw new Error('Multiple inputs are not supported at this time');
        }

        const aFromAddresses = await this._processFrom(args[0]);
        const aToAddresses   = SendAdvancedTransaction._processTo(args[1]);

        try {
            return await this._sendTransaction(aFromAddresses, aToAddresses);
        } catch (e) {
            throw new Error(`Transaction not accepted. ${e.message}`);
        }
    }

    async _sendTransaction(fromAddresses, toAddresses) {
        const oTransaction = await this._oTransactionsManager._createTransaction(
            fromAddresses,
            toAddresses,
            undefined, // nonce
            undefined, // timeLock
            undefined, // version @FIXME This is not calculated if validateVersion === false,
            undefined, // txId
            false, false, true, true, true, false,
        );

        const fee = this._oTransactionsManager.wizard.calculateFeeWizzard(oTransaction.serializeTransaction(true));

        // @TODO find a way to distribute the fee for multi inputs
        oTransaction.from.addresses[0].amount += fee;

        oTransaction.from.addresses = await Promise.all(oTransaction.from.addresses.map(async (aFromAddress) => {
            const aFromAddressResult     = aFromAddress;
            aFromAddressResult.signature = await this._oWallet.getAddress(aFromAddress.address).signTransaction(oTransaction, aFromAddress.password);

            delete aFromAddressResult.password;

            return aFromAddressResult;
        }));

        // This is needed because the fromAmount is changing
        oTransaction.serializeTransaction(true);

        try {
            oTransaction.isTransactionOK();
        } catch (e) {
            throw new Error(`Validation for the transaction failed. Error: ${e.message}`);
        }

        await this._oTransactionsManager.pendingQueue.includePendingTransaction(oTransaction, undefined, true);
        return oTransaction.txId.toString('hex');
    }

    /**
     * @param {Array} aFrom
     * @returns {Array}
     * @private
     */
    async _processFrom(aFrom) {
        return Promise.all(aFrom.map(async (aFromAddress) => {
            if (isObject(aFromAddress) === false) {
                throw new Error('From Addresses: Definition list contains invalid data. Only objects allowed');
            }

            const { address, value } = aFromAddress;
            const password = typeof aFromAddress.password !== 'undefined' ? aFromAddress.password.trim().replace(/\s\s+/g, ' ').split(' ') : undefined;

            if (isString(address) === false) {
                throw new Error('From Addresses: Address is invalid. Only string values are supported.');
            }

            if (isNumber(value) === false || value <= 0) {
                throw new Error('From Addresses: Value is invalid. Only numerical values greater than 0 are supported.');
            }

            if (value < constGlobal.SETTINGS.MEM_POOL.MINIMUM_TRANSACTION_AMOUNT) {
                throw new Error(`From Addresses: Value is less than minimum amount of ${constGlobal.SETTINGS.MEM_POOL.MINIMUM_TRANSACTION_AMOUNT}`);
            }

            const nAddressBalance = this._oAddressBalanceProvider.getBalance({ address });

            if (nAddressBalance < value) {
                throw new Error('Balance is less than value');
            }

            const oAddress = this._oWallet.getAddress(address);

            if (oAddress === null) {
                throw new Error(`Address ${address} was not found in wallet`);
            }

            try {
                if (await oAddress.isPrivateKeyEncrypted() && typeof password === 'undefined') {
                    throw new Error(`Address ${address} is encrypted. A valid password must be provided`);
                }
            } catch (e) {
                throw new Error(e.message);
            }

            return {
                address,
                publicKey: oAddress.publicKey,
                amount: value,
                password,
            };
        }));
    }

    static _processTo(aTo) {
        return aTo.map((aToAddress) => {
            if (isObject(aToAddress) === false) {
                throw new Error('To Addresses: Definition list contains invalid data. Only objects allowed');
            }

            const { address, value } = aToAddress;

            if (isString(address) === false) {
                throw new Error('To Addresses: Address is invalid. Only string value is supported.');
            }

            if (isNumber(value) === false || value <= 0) {
                throw new Error('To Addresses: "Value" is invalid. Only numerical values greater than 0 are supported.');
            }

            try {
                if (!InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address)) {
                    throw new Error(`Address ${address} is invalid`);
                }
            } catch (e) {
                throw e;
            }

            return {
                address,
                amount: value,
            };
        });
    }
}

export default authenticatedMethod(SendAdvancedTransaction);
