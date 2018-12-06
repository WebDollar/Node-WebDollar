import {RpcMethod} from './../../../jsonRpc'

/**
 * The number of transactions sent from an address.
 */
class GetTransactionCount extends RpcMethod
{
    constructor(name) {
        super(name)
    }

    getHandler(args) {
        throw new Error('GetTransactionCount method is not supported');
    }
}

export default GetTransactionCount;
