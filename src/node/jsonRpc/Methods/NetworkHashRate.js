import {RpcMethod} from './../../../jsonRpc';

/**
 * The current webdollar network hash rate.
 */
class NetworkHashRate extends RpcMethod
{
    constructor(name, oBlockchain) {
        super(name);

        this._oBlockchain = oBlockchain;
    }

    getHandler(args) {
        return this._oBlockchain.blocks.networkHashRate;
    }
}

export default NetworkHashRate;
