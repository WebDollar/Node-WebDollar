import sinon      from 'sinon';
import { assert } from 'chai';
import Accounts   from './../../Methods/Account/Accounts';
import RpcMethod  from './../../../../jsonRpc/RpcMethod';

describe('AccountsTest', () => {
    it ('should inherit from JsonRpc\\RpcMethod', () => {
        const oMethod = new Accounts('name');
        assert.instanceOf(oMethod, RpcMethod);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
