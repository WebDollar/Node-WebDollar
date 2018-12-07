import sinon from 'sinon';
import { expect, assert } from 'chai';

import RpcMethod from "../../../../jsonRpc/RpcMethod";
import NetworkHashRate from "../../Methods/NetworkHashRate";

describe('NetworkHashRateTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new NetworkHashRate('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


