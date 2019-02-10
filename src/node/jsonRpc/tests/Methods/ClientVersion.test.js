import { assert } from 'chai';

import RpcMethod     from '../../../../jsonRpc/RpcMethod';
import ClientVersion from '../../Methods/ClientVersion';

describe('ClientVersionTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new ClientVersion('name', '1.0.0');
        assert.instanceOf(oMethod, RpcMethod);
    });

    it ('should return the version', () => {
        const oMethod = new ClientVersion('name', '1.0.0');
        assert.strictEqual(oMethod.getHandler(), '1.0.0');
    });
});
