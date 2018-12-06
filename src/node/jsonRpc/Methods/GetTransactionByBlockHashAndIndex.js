import {Method} from './../../../jsonRpc'

/**
 * The information about a transaction by block hash and transaction index position.
 */
class GetTransactionByBlockHashAndIndex extends Method
{
    constructor(name, options = {}) {
        super(name, options)
    }

    getHandler(args) {
        throw new Error('GetTransactionByBlockHashAndIndex method is not supported');
    }
}

export default GetTransactionByBlockHashAndIndex;
