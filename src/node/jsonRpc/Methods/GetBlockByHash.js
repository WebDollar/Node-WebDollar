import {defaults, omitBy, isNull, isString} from 'lodash';
import {RpcMethod}                          from './../../../jsonRpc';

/**
 * The information about a block by hash.
 */
class GetBlockByHash extends RpcMethod {
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
        if (args.length < 1 || !isString(args[0])) {
            throw new Error('Params must contain at least one entry, the block hash string');
        }

        const oTransformOptions = omitBy({
            includeTransactions: args[1] || false,
            processHardForks   : args[2] || true
        }, isNull);

        const oBlock = this._oBlockRepository.findByHash(args[0]);

        if (oBlock === null) {
            return null;
        }

        return this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, {includeTransactions: false, processHardForks: true}));
    }
}

export default GetBlockByHash;
