import {Method} from './../../../jsonRpc'
import {defaults} from 'lodash'

class GetBlockByNumber extends Method
{
    constructor(name, options = {}, oBlockFinder, oBlockTransformer) {
        super(name, options);
        this._oBlockFinder      = oBlockFinder;
        this._oBlockTransformer = oBlockTransformer;
    }

    getHandler(args) {
        const oTransformOptions = {
            includeTransactions: args[1] || undefined,
            processHardForks   : args[2] || undefined
        };

        const oBlock = this._oBlockFinder.findByNumberOrTag(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        return this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, {includeTransactions: false, processHardForks: true}));
    }
}

export default GetBlockByNumber;
