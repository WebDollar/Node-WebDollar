import { expect, assert } from 'chai';

import BlockFinder from '../../Utils/BlockFinder';

describe('BlockFinderTest', () => {
    const Blockchain = {
        blocksStartingPoint: 0,
        blocks: {
            0: {
                id: 'block_0'
            },
            10: {
                id: 'block_10'
            },
            11: {
                id: 'block_11'
            },
            12: {
                id: 'block_12'
            },
            100: {
                id: 'block_100'
            },
            last: {
                height: 100
            }
        }
    };

    const oBlockFinder = new BlockFinder(Blockchain);

    it ('BlockFinder::findByNumberOrTag should throw exception if block number is invalid', () => {
        expect(() => {oBlockFinder.findByNumberOrTag('invalid');}).to.throw('Invalid Block');
    });

    it ('BlockFinder::findByNumberOrTag should throw exception if block tag is "pending"', () => {
        expect(() => {oBlockFinder.findByNumberOrTag('pending');}).to.throw('Finding a block by "pending" is not supported');
    });

    it ('BlockFinder::findByNumberOrTag should throw exception if block number is less than starting point', () => {
        expect(() => {oBlockFinder.findByNumberOrTag(-1);}).to.throw('Invalid Block');
    });

    it ('BlockFinder::findByNumberOrTag should throw exception if block number is grater than last height', () => {
        expect(() => {oBlockFinder.findByNumberOrTag(1000);}).to.throw('Invalid Block');
    });

    it ('BlockFinder::findByNumberOrTag should return the block at requested height', () => {
        assert.strictEqual(oBlockFinder.findByNumberOrTag(12).id, 'block_12');
    });

    it ('BlockFinder::findByNumberOrTag should return the first block when using "earliest"', () => {
        assert.strictEqual(oBlockFinder.findByNumberOrTag('earliest').id, 'block_0');
    });

    it ('BlockFinder::findByNumberOrTag should return the last block when using "latest"', () => {
        assert.strictEqual(oBlockFinder.findByNumberOrTag('latest').id, 'block_100');
    });

    it ('BlockFinder::findByRange should throw exception if starting block number is not numeric', () => {
        expect(() => {oBlockFinder.findByRange('invalid');}).to.throw('Invalid starting block number');
    });

    it ('BlockFinder::findByRange should throw exception if ending block number is not valid', () => {
        expect(() => {oBlockFinder.findByRange(100, 'invalid');}).to.throw('Invalid ending block number');
    });

    it ('BlockFinder::findByRange should throw exception if ending block number is less than starting block number', () => {
        expect(() => {oBlockFinder.findByRange(100, 10);}).to.throw('Ending number must be greater (or equal) than the starting number, but no more than the last block height');
    });

    it ('BlockFinder::findByRange should throw exception if ending block number is greater than last height', () => {
        expect(() => {oBlockFinder.findByRange(100, 1000);}).to.throw('Ending number must be greater (or equal) than the starting number, but no more than the last block height');
    });

    it ('BlockFinder::findByRange should throw exception if range is greater than the limit', () => {
        expect(() => {oBlockFinder.findByRange(0, 100);}).to.throw('Only a maximum of 50 blocks can be returned');
    });

    it ('BlockFinder::findByRange should return the blocks in range', () => {
        const aBLocks = oBlockFinder.findByRange(10, 12);
        assert.strictEqual(aBLocks.length, 3);
    });

    it ('BlockFinder::findByNumbers should throw exception if argument is not an Array', () => {
        expect(() => {oBlockFinder.findByNumbers('invalid');}).to.throw('Invalid argument. An Array containing the block numbers must be provided');
    });

    it ('BlockFinder::findByNumbers should throw exception if the blocks number exceed the limit set', () => {
        expect(() => {oBlockFinder.findByNumbers(Array.apply(null, {length: 51}).map(Number.call, Number));}).to.throw('Only a maximum of 50 blocks can be returned');
    });

    it ('BlockFinder::findByNumbers should return the requested blocks', () => {
        const aBLocks = oBlockFinder.findByNumbers([10, 12]);
        assert.strictEqual(aBLocks.length, 2);
    });
});
