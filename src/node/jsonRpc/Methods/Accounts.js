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

            let nBalanceRaw = 0;

            try
            {
                nBalanceRaw = this._oAddressBalanceProvider.getBalance(oAddress);
            }
            catch (e)
            {
                nBalanceRaw = 0;
            }

            return {
                address: oAddress.address,
                balance: nBalanceRaw / WebDollarCoins.WEBD,
                balance_raw: nBalanceRaw,
            };
        });
    }
}

export default authenticatedMethod(Accounts);
