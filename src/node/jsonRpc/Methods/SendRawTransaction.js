import {authenticatedMethod, RpcMethod} from './../../../jsonRpc';

/**
 * Creates a new transaction for pre-signed transactions.
 */
class SendRawTransaction extends RpcMethod
{
    constructor(name) {
        super(name);
    }

    getHandler(args) {
        throw new Error('SendRawTransaction method is not supported');
    }
}

export default authenticatedMethod(SendRawTransaction);
