import sinon from 'sinon';
import { expect, assert } from 'chai';

import RpcMethod from "../../../../jsonRpc/RpcMethod";
import ProtocolVersion from "../../Methods/ProtocolVersion";

describe('ProtocolVersionTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new ProtocolVersion('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


