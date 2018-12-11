import {RpcMethod} from './../../../jsonRpc';

/**
 * The information about a transaction requested by transaction hash.
 */
class GetTransactionByHash extends RpcMethod
{
    constructor(name) {
        super(name);
    }

    getHandler(args) {
        throw new Error('GetTransactionByHash method is not supported');
    }
}

export default GetTransactionByHash;
