import { authenticatedMethod, RpcMethod } from './../../../../jsonRpc';

/**
 * Stop mining
 */
class StopMining extends RpcMethod
{
    constructor(name, oBlockchain) {
        super(name);
        this._oBlockchain = oBlockchain;
    }

    async getHandler(args) {
        this._oBlockchain.Mining.stopMining();
        this._oBlockchain.startMiningNextTimeSynchronized = false;

        return true;
    }
}

export default authenticatedMethod(StopMining);
