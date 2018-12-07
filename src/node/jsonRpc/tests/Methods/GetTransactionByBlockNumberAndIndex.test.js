import sinon from 'sinon';
import { expect, assert } from 'chai';

import RpcMethod from "../../../../jsonRpc/RpcMethod";
import GetTransactionByBlockNumberAndIndex from "../../Methods/GetTransactionByBlockNumberAndIndex";

describe('GetTransactionByBlockNumberAndIndexTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new GetTransactionByBlockNumberAndIndex('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});

