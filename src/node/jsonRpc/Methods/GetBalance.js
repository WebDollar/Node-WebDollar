import {Method} from './../../../jsonRpc'

class GetBalance extends Method
{
    constructor(name, options = {}, oWallet, oAddressBalanceProvider) {
        super(name, options)
        this._oWallet                 = oWallet;
        this._oAddressBalanceProvider = oAddressBalanceProvider;
    }

    getHandler(args) {
        const sAddress = args[0] || undefined;
        const oAddress = this._oWallet.getAddress(sAddress, false);

        if (oAddress === null)
        {
            throw new Error('Address not found');
        }

        return this._oAddressBalanceProvider.getBalance(oAddress);
    }
}

export default GetBalance;
