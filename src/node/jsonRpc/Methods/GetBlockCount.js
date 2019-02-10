import RpcMethod from './../../../jsonRpc/RpcMethod';

/**
 * The number of blocks mined by an address.
 */
class GetBlockCount extends RpcMethod
{
    /**
     * @param {string} name
     * @param {BlockRepository} oBlockRepository
     */
    constructor(name, oBlockRepository) {
        super(name);

        this._oBlockRepository = oBlockRepository;
    }

    getHandler(args) {
        if (args.length !== 1)
        {
            throw new Error('Params must contain exactly one entry, the requested address');
        }

        return this._oBlockRepository.countByAddress(args[0]);
    }
}

export default GetBlockCount;
