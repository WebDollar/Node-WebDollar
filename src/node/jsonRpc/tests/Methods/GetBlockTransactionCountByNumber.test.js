import sinon from 'sinon';
import { expect, assert } from 'chai';

import RpcMethod from "../../../../jsonRpc/RpcMethod";
import GetBlockTransactionCountByNumber from "../../Methods/GetBlockTransactionCountByNumber";

describe('GetBlockTransactionCountByNumberTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new GetBlockTransactionCountByNumber('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


