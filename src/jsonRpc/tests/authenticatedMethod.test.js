import { assert } from 'chai';
import RpcMethod from './../RpcMethod';
import authenticatedMethod from './../authenticatedMethod';

describe('authenticatedMethodTest', () => {
    it('should return a RpcMethod instance, which is private', ()=> {
        const oRpcMethod = authenticatedMethod(RpcMethod)('name');
        assert.instanceOf(oRpcMethod, RpcMethod);
        assert.isOk(oRpcMethod.isPrivate());
    });
})
