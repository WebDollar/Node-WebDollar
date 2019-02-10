import {RpcMethod}                      from './../../../jsonRpc';
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
        let sAddress = args[0] || null;

        if (InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(sAddress) === null)
        {
            throw new Error('Address is invalid');
        }

        return this._oAddressBalanceProvider.getBalance({address: sAddress});
    }
}

export default GetBalance;
