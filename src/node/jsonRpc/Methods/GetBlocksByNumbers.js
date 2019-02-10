import {defaults, isArray, omitBy, isNull,} from 'lodash';
import {RpcMethod}                          from './../../../jsonRpc';

/**
 * Th information about blocks by numbers.
 */
class GetBlocksByNumbers extends RpcMethod {
    constructor(name, oBlockRepository, oBlockTransformer) {
        super(name);
        this._oBlockRepository  = oBlockRepository;
        this._oBlockTransformer = oBlockTransformer;
    }

    getHandler(args) {
        const oTransformOptions = omitBy({
            includeTransactions: args[1] || null,
            processHardForks   : args[2] || null
        }, isNull);

        if (isArray(args[0]) === false) {
            throw new Error('First parameter must be an Array containing the corresponding block numbers');
        }

        const aBlocks          = this._oBlockRepository.findByNumbers(args[0]);
        let aTransformedBlocks = [];

        for (const oBlock of aBlocks) {
            aTransformedBlocks.push(this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, {includeTransactions: false, processHardForks: true})));
        }

        return aTransformedBlocks;
    }
}

export default GetBlocksByNumbers;
