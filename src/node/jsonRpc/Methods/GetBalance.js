import {RpcMethod} from './../../../jsonRpc';
import InterfaceBlockchainAddressHelper from './../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

/**
 * The balance of the account of given address.
 */
class GetBalance extends RpcMethod {
    constructor(name, oAddressBalanceProvider) {
        super(name);
        this._oAddressBalanceProvider = oAddressBalanceProvider;
    }

    getHandler(args) {
        let sAddress = args[0] || undefined;

        try {
            sAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(sAddress);

            if (sAddress === null)
            {
                throw new Error('Address cannot be decoded');
            }
        }
        catch (exception) {
            console.error(exception);
            throw new Error('Address is invalid');
        }

        try {
            return this._oAddressBalanceProvider.getBalance({address: sAddress});
        }
        catch (e) {
            return 0;
        }
    }
}

export default GetBalance;
