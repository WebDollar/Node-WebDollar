import {defaults, omitBy, isNull} from 'lodash';
import {RpcMethod}                from './../../../jsonRpc';

/**
 * Th information about a block by block number.
 */
class GetBlockByNumber extends RpcMethod {
    constructor(name, oBlockRepository, oBlockTransformer) {
        super(name);
        this._oBlockRepository  = oBlockRepository;
        this._oBlockTransformer = oBlockTransformer;
    }

    getHandler(args) {
        if (args.length < 1) {
            throw new Error('Params must contain at least one entry, the block number/TAG');
        }

        const oTransformOptions = omitBy({
            includeTransactions: args[1] || null,
            processHardForks   : args[2] || null
        }, isNull);

        const oBlock = this._oBlockRepository.findByNumberOrTag(args[0]);

        if (oBlock === null) {
            return null;
        }

        return this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, {includeTransactions: false, processHardForks: true}));
    }
}

export default GetBlockByNumber;
