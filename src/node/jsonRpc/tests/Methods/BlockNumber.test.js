import sinon from 'sinon';
import { assert } from 'chai';

import BlockNumber from './../../Methods/BlockNumber';
import Blockchain from './../../../../main-blockchain/Blockchain';
import RpcMethod from '../../../../jsonRpc/RpcMethod';

describe('BlockNumberTest', () => {
    const oBlockchain = Blockchain.blockchain;

    it ('show return the last block number', () => {
        sinon.stub(oBlockchain, 'blocks').value({
            last: {
                height: 10
            }
        });

        const oBlockNumber = new BlockNumber('name', oBlockchain);
        assert.strictEqual(oBlockNumber.getHandler(), 10);
    });

    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new BlockNumber('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
