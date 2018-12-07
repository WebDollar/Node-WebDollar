import {RpcMethod} from './../../../jsonRpc';

/**
 * The number of the most recent block.
 */
class BlockNumber extends RpcMethod
{
    constructor(name, oBlockchain) {
        super(name);
        this._oBlockchain = oBlockchain;
    }

    getHandler(args) {
        return this._oBlockchain.blocks.last.height;
    }
}

export default BlockNumber;
