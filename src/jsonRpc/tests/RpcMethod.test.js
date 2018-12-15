import { expect, assert } from 'chai';

import RpcMethod from './../RpcMethod';

describe('RpcMethodTest', () => {
    it('RpcMethod::constructor should set the name', ()=> {
        const oRpcMethod = new RpcMethod('name');
        assert.strictEqual('name', oRpcMethod.getName());
    });

    it('RpcMethod::constructor should throw exception on invalid name', () => {
        expect(() => {return new RpcMethod();}).to.throw(Error, 'Name must be defined as a non empty string');
        expect(() => {return new RpcMethod(null);}).to.throw(Error, 'Name must be defined as a non empty string');
    });

    it('RpcMethod::getOptions should return a Map instance', () => {
        const oRpcMethod = new RpcMethod('name');
        assert.instanceOf(oRpcMethod.getOptions(), Map);
    });

    it('RpcMethod::getOption should return null when option is not present', () => {
        const oRpcMethod = new RpcMethod('name');
        assert.strictEqual(null, oRpcMethod.getOption('test'));
    });

    it('RpcMethod::setOption should set single option', () => {
        const oRpcMethod = new RpcMethod('name');
        oRpcMethod.setOption('test', 'test');
        assert.strictEqual('test', oRpcMethod.getOption('test'));
    });

    it('RpcMethod::setOption should overwrite existing option value', () => {
        const oRpcMethod = new RpcMethod('name');
        oRpcMethod.setOption('test', 'test');
        assert.strictEqual('test', oRpcMethod.getOption('test'));

        oRpcMethod.setOption('test', 'test2');
        assert.strictEqual('test2', oRpcMethod.getOption('test'));
    });

    it('RpcMethod::getHandler should throw exception by default', () => {
        expect(() => {(new RpcMethod('name')).getHandler();}).to.throw(Error, 'Handler is not defined');
    });

    it('RpcMethod::getParamType should return "Array" by default', () => {
        const oRpcMethod = new RpcMethod('name');
        assert.strictEqual(Array, oRpcMethod.getParamType());
    });

    it('RpcMethod::isPrivate should return false by default', () => {
        const oRpcMethod = new RpcMethod('name');
        assert.isNotOk(oRpcMethod.isPrivate());
    });
});
