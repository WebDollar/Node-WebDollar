import { authenticatedMethod, RpcMethod } from './../../../../jsonRpc';

/**
 * Set The mining account.
 */
class SetMiningAccount extends RpcMethod
{
    constructor(name, oBlockchain, oWallet) {
        super(name);
        this._oBlockchain = oBlockchain;
        this._oWallet = oWallet;
    }

    getHandler(args) {
        const sAddress = args[0] || null;
        const oAddress = this._oWallet.getAddress(sAddress);

        if (oAddress === null) {
            throw new Error('Account not found.');
        }

        this._oBlockchain.mining.minerAddress = oAddress.address;

        return {
            address: oAddress.address,
            mining: true,
        };
    }
}

export default authenticatedMethod(SetMiningAccount);
