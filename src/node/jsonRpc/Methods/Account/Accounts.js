import { authenticatedMethod, RpcMethod } from './../../../../jsonRpc';
import WebDollarCoins                     from './../../../../common/utils/coins/WebDollar-Coins';

/**
 * The list of addresses in the wallet.
 */
class Accounts extends RpcMethod {
    constructor(name, oWallet, oAddressBalanceProvider) {
        super(name);
        this._oWallet                 = oWallet;
        this._oAddressBalanceProvider = oAddressBalanceProvider;
    }

    async getHandler(args) {
        const bAsObject        = args[0] || false;
        const bEncryptedStatus = args[1] || false;

        const aAddresses = this._oWallet.addresses.map(async (oAddress) => {
            if (bAsObject === false) {
                return oAddress.address;
            }

            let nBalanceRaw = 0;

            try {
                nBalanceRaw = this._oAddressBalanceProvider.getBalance(oAddress);
            } catch (e) {
                nBalanceRaw = 0;
            }

            const oResponse = {
                address: oAddress.address,
                balance: nBalanceRaw / WebDollarCoins.WEBD,
                balance_raw: nBalanceRaw,
            };

            if (bEncryptedStatus) {
                oResponse.isEncrypted = await oAddress.isPrivateKeyEncrypted();
            }

            return oResponse;
        });

        return Promise.all(aAddresses);
    }
}

export default authenticatedMethod(Accounts);
