import sinon from 'sinon';
import { assert } from 'chai';

import RpcMethod from '../../../../jsonRpc/RpcMethod';
import GetBalance from '../../Methods/GetBalance';

describe('GetBalanceTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new GetBalance('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
