import {RpcMethod} from './../../../jsonRpc';
import {defaults} from 'lodash';

/**
 * The information about a block by hash.
 */
class GetBlockByHash extends RpcMethod
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

        const oBlock = this._oBlockFinder.findByHash(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        return this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, {includeTransactions: false, processHardForks: true}));
    }
}

export default GetBlockByHash;
