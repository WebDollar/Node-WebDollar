import sinon from 'sinon';
import {assert, expect} from 'chai';

import RpcMethod from '../../../../jsonRpc/RpcMethod';
import GetBlockTransactionCountByNumber from '../../Methods/GetBlockTransactionCountByNumber';
import BlockRepository from '../../Utils/BlockRepository';

describe('GetBlockTransactionCountByNumberTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new GetBlockTransactionCountByNumber('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

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

    const oBlockRepository = new BlockRepository(Blockchain);

    // it ('should throw exception if block number or tag is not specified', () => {
    //     const oGetBlockTransactionCountByNumber = new GetBlockTransactionCountByNumber('name', oBlockRepository);
    //     expect(() => {oBlockRepository.findByNumberOrTag('invalid');}).to.throw('Invalid Block');
    // });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


