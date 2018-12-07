import sinon from 'sinon';
import { expect, assert } from 'chai';

import RpcMethod from "../../../../jsonRpc/RpcMethod";
import GetBlockTransactionCountByHash from "../../Methods/GetBlockTransactionCountByHash";

describe('GetBlockTransactionCountByHashTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new GetBlockTransactionCountByHash('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
