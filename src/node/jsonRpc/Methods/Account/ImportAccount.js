import {authenticatedMethod, RpcMethod} from './../../../../jsonRpc';
import {isObject}                       from 'lodash';

/**
 * Import an account into the wallet
 */
class ImportAccount extends RpcMethod
{
    constructor(name, oWallet) {
        super(name);
        this._oWallet = oWallet;
    }

    async getHandler(args) {
        let oData = args[0] || null;

        if (isObject(oData) === false)
        {
            throw new Error('First parameter must be an Object');
        }

        const aImportResult = await this._oWallet.importAddressFromJSON(oData);

        if (aImportResult.result === false)
        {
            throw new Error(`Unable to import the account. Reason: ${aImportResult.message}`);
        }

        return {
            address  : aImportResult.address,
            publicKey: aImportResult.publicKey.toString('hex'),
        };
    }
}

export default authenticatedMethod(ImportAccount);
