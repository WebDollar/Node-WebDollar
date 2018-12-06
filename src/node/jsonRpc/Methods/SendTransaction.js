import {Method} from './../../../jsonRpc'
import {isObject, isString, isNumber} from 'lodash'

class SendTransaction extends Method
{
    constructor(name, options = {}) {
        super(name, options);
    }

    async getHandler(args) {
        if (args.length !== 1 || isObject(args[0]) === false)
        {
            throw new Error('Params must contain exactly one entry and that entry must be an object');
        }

        const fromAddress = args[0].from;
        const toAddress   = args[0].to;
        const value       = args[0].value;
        const fee         = args[0].fee;
        const password    = args[0].password;

        if (isString(fromAddress) === false)
        {
            throw new Error('From address is invalid. Only string values are supported.')
        }

        if (isString(toAddress) === false)
        {
            throw new Error('To address is invalid. Only string value is supported.')
        }

        if (isNumber(value) === false || value <= 0)
        {
            throw new Error('Value is invalid. Only numerical values greater than 0 are supported.')
        }

        if (typeof fee !== 'undefined' && (isNumber(fee) === false || fee <= 0))
        {
            throw new Error('Fee is invalid. Only numerical values greater than 0 are supported.')
        }

        let oTransaction = await this._oTransactionsManager.wizard.createTransactionSimple( fromAddress, toAddress, value, fee, undefined, password)

        if (!oTransaction.result)
        {
            throw new Error('Transaction not accepted. ' + oTransaction.message);
        }
    }
}

export default SendTransaction;
