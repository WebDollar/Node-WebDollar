import {authenticatedMethod, RpcMethod} from './../../../jsonRpc';
import WebDollarCoins from './../../../common/utils/coins/WebDollar-Coins';

/**
 * The list of addresses in the wallet.
 */
class Accounts extends RpcMethod
{
    constructor(name, oWallet, oAddressBalanceProvider) {
        super(name);
        this._oWallet                 = oWallet;
        this._oAddressBalanceProvider = oAddressBalanceProvider;
    }

    getHandler(args) {
        const bIncludeBalance = args[0] || false;

        return this._oWallet.addresses.map((oAddress) => {
            if (bIncludeBalance === false)
            {
                return oAddress.address;
            }

            const balance_raw = this._oAddressBalanceProvider.getBalance(oAddress);

            return {
                address: oAddress.address,
                balance: balance_raw === null ? 0 : (balance_raw / WebDollarCoins.WEBD),
                balance_raw: balance_raw || 0
            };
        });
    }
}

export default authenticatedMethod(Accounts);
