import {authenticatedMethod, RpcMethod} from './../../../../jsonRpc';

/**
 * Export an existing account from the wallet
 */
class ExportAccount extends RpcMethod {
    constructor(name, oWallet) {
        super(name);
        this._oWallet = oWallet;
    }

    async getHandler(args) {
        let sAddress = args[0] || null;
        let oAddress = this._oWallet.getAddress(sAddress);

        if (oAddress === null) {
            throw new Error('Account not found.');
        }

        const aExportResult = await this._oWallet.exportAddressToJSON(oAddress.address);

        if (aExportResult.result === false) {
            throw new Error(`Unable to export the account. Reason: ${aExportResult.message}`);
        }

        return aExportResult.data;
    }
}

export default authenticatedMethod(ExportAccount);
