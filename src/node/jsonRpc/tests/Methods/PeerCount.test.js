import sinon from 'sinon';
import { assert } from 'chai';

import RpcMethod from '../../../../jsonRpc/RpcMethod';
import PeerCount from '../../Methods/PeerCount';

describe('PeerCountTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new PeerCount('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


