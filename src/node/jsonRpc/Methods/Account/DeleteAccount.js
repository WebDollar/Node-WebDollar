import {authenticatedMethod, RpcMethod} from './../../../../jsonRpc';
import {isEmpty} from 'lodash';
/**
 * Delete an account from the wallet
 */
class DeleteAccount extends RpcMethod
{
    constructor(name, oWallet) {
        super(name);
        this._oWallet  = oWallet;
    }

    async getHandler(args) {
        let sAddress  = args[0] || null;
        let sPassword = args[1] || null;

        let oAddress = this._oWallet.getAddress(sAddress);

        if (oAddress === null)
        {
            throw new Error('Account not found.');
        }

        if (await this._oWallet.isAddressEncrypted(oAddress) && isEmpty(sPassword))
        {
            throw new Error('Account is encrypted and a password was not provided. (Password must be provided as the second parameter).');
        }

        let oDeleteResult = await this._oWallet.deleteAddress(oAddress, false, sPassword);

        if (oDeleteResult.result === false)
        {
            throw new Error(`Unable to delete the account. Reason: ${oDeleteResult.message}`);
        }

        return true;
    }
}

export default authenticatedMethod(DeleteAccount);
