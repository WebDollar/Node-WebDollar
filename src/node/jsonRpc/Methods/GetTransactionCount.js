import {Method} from './../../../jsonRpc'

/**
 * The number of transactions sent from an address.
 */
class GetTransactionCount extends Method
{
    constructor(name, options = {}) {
        super(name, options)
    }

    getHandler(args) {
        throw new Error('GetTransactionCount method is not supported');
    }
}

export default GetTransactionCount;
