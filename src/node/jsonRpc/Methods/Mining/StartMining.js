import { authenticatedMethod, RpcMethod } from './../../../../jsonRpc';

/**
 * Start mining
 */
class StartMining extends RpcMethod
{
    constructor(name, oBlockchain) {
        super(name);
        this._oBlockchain = oBlockchain;
    }

    async getHandler(args) {
        const bStartInstantly = args[0] || false;

        if (bStartInstantly) {
            await this._oBlockchain.startMiningInstantly();
        }
        else {
            this._oBlockchain.startMiningNextTimeSynchronized = true;
        }

        return true;
    }
}

export default authenticatedMethod(StartMining);
