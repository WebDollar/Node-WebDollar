import {Method} from './../../../jsonRpc'

class SendRawTransaction extends Method
{
    constructor(name, options = {}) {
        super(name, options);
    }

    getHandler(args) {
    }
}

export default SendRawTransaction;
