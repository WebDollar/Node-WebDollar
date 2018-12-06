class BlockFinder
{
    constructor(oBlockchain) {
        this._oBlockchain = oBlockchain;
    }

    findByNumberOrTag(mBlockNumber) {
        switch(mBlockNumber)
        {
            case 'latest':
                mBlockNumber = this._oBlockchain.blocks.last.height
                break;
            case 'earliest':
                mBlockNumber = 0;
                break;
            case 'pending':
                throw new Error('Finding a block by "pending" is not supported');
            default:
                mBlockNumber = this._oBlockchain.blocks.last.height
        }

        if (Number.isInteger(mBlockNumber) === false)
        {
            throw new Error('Invalid block number');
        }

        if (mBlockNumber < this._oBlockchain.blocksStartingPoint)
        {
            throw new Error('Invalid block number');
        }

        if (mBlockNumber > this._oBlockchain.blocks.length)
        {
            throw new Error('Block not found.');
        }

        try
        {
            return this._oBlockchain.blocks[mBlockNumber];
        }
        catch (exception)
        {
            throw new Error('Invalid Block');
        }
    }

    findByHash(hash) {
        throw new Error('BlockFinder::findByHash is not supported');
    }
}

export default BlockFinder;
