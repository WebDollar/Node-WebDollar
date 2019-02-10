import {RpcMethod} from './../../../jsonRpc';
import {defaults} from 'lodash';

/**
 * The information about a block by hash.
 */
class GetBlockByHash extends RpcMethod
{
    /**
     * @param {string} name
     * @param {BlockRepository} oBlockRepository
     * @param {BlockTransformer} oBlockTransformer
     */
    constructor(name, oBlockRepository, oBlockTransformer) {
        super(name);
        this._oBlockRepository  = oBlockRepository;
        this._oBlockTransformer = oBlockTransformer;
    }

    getHandler(args) {
        if (args.length < 1)
        {
            throw new Error('Params must contain at least one entry, the block hash');
        }

        const oTransformOptions = {
            includeTransactions: args[1] || undefined,
            processHardForks   : args[2] || undefined
        };

        const oBlock = this._oBlockRepository.findByHash(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        return this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, {includeTransactions: false, processHardForks: true}));
    }
}

export default GetBlockByHash;
