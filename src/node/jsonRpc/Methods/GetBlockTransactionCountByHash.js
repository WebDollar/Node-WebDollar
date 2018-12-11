import {RpcMethod} from './../../../jsonRpc';

/**
 * The number of transactions in a block from a block matching the given block hash.
 */
class GetBlockTransactionCountByHash extends RpcMethod
{
    constructor(name) {
        super(name);
    }

    getHandler(args) {
        throw new Error('GetTransactionCount method is not supported');
    }
}
export default GetBlockTransactionCountByHash;
