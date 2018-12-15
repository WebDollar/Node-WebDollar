import sinon from 'sinon';
import { assert } from 'chai';

import RpcMethod from '../../../../jsonRpc/RpcMethod';
import SendRawTransaction from '../../Methods/SendRawTransaction';

describe('SendRawTransactionTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new SendRawTransaction('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


