import sinon from 'sinon';
import { assert } from 'chai';

import RpcMethod from '../../../../jsonRpc/RpcMethod';
import Syncing from '../../Methods/Syncing';

describe('SyncingTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new Syncing('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});


