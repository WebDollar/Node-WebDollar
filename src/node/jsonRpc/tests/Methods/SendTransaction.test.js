import sinon from 'sinon';
import { assert } from 'chai';

import RpcMethod from '../../../../jsonRpc/RpcMethod';
import SendTransaction from '../../Methods/SendTransaction';

describe('SendTransactionTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new SendTransaction('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


