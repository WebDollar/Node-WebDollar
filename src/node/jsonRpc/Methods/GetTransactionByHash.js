import {Method} from './../../../jsonRpc'

/**
 * The information about a transaction requested by transaction hash.
 */
class GetTransactionByHash extends Method
{
    constructor(name, options = {}) {
        super(name, options)
    }

    getHandler(args) {
        throw new Error('GetTransactionByHash method is not supported');
    }
}

export default GetTransactionByHash;
