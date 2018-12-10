import {isArray, isInteger, uniq} from 'lodash';

class BlockFinder
{
    constructor(oBlockchain) {
        this._oBlockchain = oBlockchain;
    }

    findByNumberOrTag(mBlockNumber) {
        switch(mBlockNumber)
        {
            case 'latest':
                mBlockNumber = this._oBlockchain.blocks.last.height;
                break;
            case 'earliest':
                mBlockNumber = 0;
                break;
            case 'pending':
                throw new Error('Finding a block by "pending" is not supported');
        }

        if (isInteger(mBlockNumber) === false)
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

    findByRange(mStartingNumber, mEndingNumber) {
        const nMaxRange = 50;
        let aBlocks     = [];

        if (isInteger(mStartingNumber) === false)
        {
            throw new Error('Invalid starting block number');
        }

        switch(mEndingNumber)
        {
            case 'latest':
                mEndingNumber = this._oBlockchain.blocks.last.height;
                break;
            case 'earliest':
                throw new Error('Finding a block by "earliest" is not supported');
            case 'pending':
                throw new Error('Finding a block by "pending" is not supported');
        }

        if (isInteger(mEndingNumber) === false)
        {
            throw new Error('Invalid ending block number');
        }

        if (mEndingNumber < mStartingNumber || mEndingNumber > this._oBlockchain.blocks.last.height)
        {
            throw new Error('Ending number must be greater (or equal) than the starting number, but no more than the last block height');
        }

        if (mEndingNumber - mStartingNumber > nMaxRange)
        {
            throw new Error('Only a maximum of ' + nMaxRange + ' blocks can be returned');
        }

        for (let i = mStartingNumber; i<=mEndingNumber; i++)
        {
            aBlocks.push(this.findByNumberOrTag(i));
        }

        return aBlocks;
    }

    findByNumbers(aNumbers) {
        if (isArray(aNumbers) === false)
        {
            throw new Error('Invalid argument. An Array containing the block numbers must be provided');
        }

        const nMaxRange = 50;
        let aBlocks     = [];
        aNumbers        = uniq(aNumbers);

        if (aNumbers.length > 50)
        {
            throw new Error('Only a maximum of ' + nMaxRange + ' blocks can be returned');
        }

        for (let i in aNumbers)
        {
            aBlocks.push(this.findByNumberOrTag(aNumbers[i]));
        }

        return aBlocks;
    }

    findByHash(hash) {
        throw new Error('BlockFinder::findByHash is not supported');
    }
}

export default BlockFinder;
