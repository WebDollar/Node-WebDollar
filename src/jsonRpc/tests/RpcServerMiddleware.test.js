import { expect, assert }  from 'chai';
import RpcMethodManager    from './../RpcMethodManager';
import RpcServerMiddleware from './../RpcServerMiddleware';

describe('RpcServerMiddlewareTest', () => {
    it('RpcServerMiddleware::constructor should throw exception if argument is not an instance of RpcMethodManager', () => {
        expect(() => {
            return new RpcServerMiddleware();
        }).to.throw(Error, 'MethodManager must be an instance of JsonRpc\\RpcMethodManager');
    });

    it('RpcServerMiddleware::constructor should set the method manager', () => {
        const oRpcMethodManager    = new RpcMethodManager();
        const oRpcServerMiddleware = new RpcServerMiddleware(oRpcMethodManager);
        assert.instanceOf(oRpcServerMiddleware.getMethodManager(), RpcMethodManager);
    });

    it('RpcServerMiddleware::setMethodManager should throw exception if argument is not an instance of RpcMethodManager', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {
            return (new RpcServerMiddleware(oRpcMethodManager)).setMethodManager();
        }).to.throw(Error, 'MethodManager must be an instance of JsonRpc\\RpcMethodManager');
    });

    it('RpcServerMiddleware::getMiddleware should return the middleware', () => {
        const oRpcMethodManager    = new RpcMethodManager();
        const oRpcServerMiddleware = new RpcServerMiddleware(oRpcMethodManager);
        assert.instanceOf(oRpcServerMiddleware.getMiddleware(false), Function);
    });
});
