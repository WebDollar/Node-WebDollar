import {RpcMethod} from './../../../jsonRpc';

/**
 * The information about a transaction by block hash and transaction index position.
 */
class GetTransactionByBlockHashAndIndex extends RpcMethod
{
    constructor(name) {
        super(name);
    }

    getHandler(args) {
        throw new Error('GetTransactionByBlockHashAndIndex method is not supported');
    }
}

export default GetTransactionByBlockHashAndIndex;
