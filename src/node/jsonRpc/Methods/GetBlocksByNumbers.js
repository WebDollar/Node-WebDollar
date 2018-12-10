import {RpcMethod} from './../../../jsonRpc';
import {defaults, isArray} from 'lodash';

/**
 * Th information about blocks by numbers.
 */
class GetBlocksByNumbers extends RpcMethod
{
    constructor(name, oBlockFinder, oBlockTransformer) {
        super(name);
        this._oBlockFinder      = oBlockFinder;
        this._oBlockTransformer = oBlockTransformer;
    }

    getHandler(args) {
        const oTransformOptions = {
            includeTransactions: args[1] || undefined,
            processHardForks   : args[2] || undefined
        };

        if (isArray(args[0]) === false)
        {
            throw new Error('First parameters must be an Array containing the corresponding block numbers');
        }

        const aBlocks          = this._oBlockFinder.findByNumbers(args[0]);
        let aTransformedBlocks = [];

        for (let i in aBlocks)
        {
            aTransformedBlocks.push(this._oBlockTransformer.transform(aBlocks[i], defaults(oTransformOptions, {includeTransactions: false, processHardForks: true})));
        }

        return aTransformedBlocks;
    }
}

export default GetBlocksByNumbers;
