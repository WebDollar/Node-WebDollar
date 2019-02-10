import { assert } from 'chai';

import RpcMethod  from '../../../../jsonRpc/RpcMethod';
import ProtocolVersion from '../../Methods/ProtocolVersion';

describe('ProtocolVersionTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new ProtocolVersion('name', 'v1.0.0');
        assert.instanceOf(oMethod, RpcMethod);
    });

    it ('should return the protocol version', () => {
        const oMethod = new ProtocolVersion('name', 'v1.0.0');
        assert.strictEqual(oMethod.getHandler(), 'v1.0.0');
    });
});
