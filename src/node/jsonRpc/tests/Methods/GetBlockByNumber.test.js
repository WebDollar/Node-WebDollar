import sinon from 'sinon';
import { expect, assert } from 'chai';

import RpcMethod from "../../../../jsonRpc/RpcMethod";
import GetBlockByNumber from "../../Methods/GetBlockByNumber";

describe('GetBlockByNumberTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new GetBlockByNumber('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
