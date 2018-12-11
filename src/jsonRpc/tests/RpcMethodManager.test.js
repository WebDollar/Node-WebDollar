import RpcMethodManager from './../RpcMethodManager';
import RpcMethod        from './../RpcMethod';

import { expect, assert } from 'chai';

describe('RpcMethodManagerTest', () => {
    it('RpcMethodManager::__construct should initialize methods property as a Map instance', ()=> {
        const oRpcMethodManager = new RpcMethodManager();
        assert.instanceOf(oRpcMethodManager.getMethods(), Map);
    });

    it('RpcMethodManager::addMethods should throw exception if argument is not an instance of Array', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {return oRpcMethodManager.addMethods('invalid');}).to.throw(Error, 'Argument must be an instance of Array');
    });

    it('RpcMethodManager::addMethods should throw exception if Array entries are not instances of RpcMethod', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {return oRpcMethodManager.addMethods(['invalid']);}).to.throw(Error, 'Method must be an instance of "JsonRpc\\RpcMethod"');
    });

    it('RpcMethodManager::addMethods should add RpcMethods', () => {
        const oRpcMethodManager = new RpcMethodManager();
        const oRpcMethod = new RpcMethod('name');

        oRpcMethodManager.addMethods([oRpcMethod]);
        assert.isOk(oRpcMethodManager.hasMethod(oRpcMethod));
        assert.strictEqual(oRpcMethodManager.getMethod('name'), oRpcMethod);
    });

    it('RpcMethodManager::addMethod should throw exception if argument is not an instance of RpcMethod', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {return oRpcMethodManager.addMethod('invalid');}).to.throw(Error, 'Method must be an instance of "JsonRpc\\RpcMethod"');
    });

    it('RpcMethodManager::addMethod should add exactly one RpcMethod', () => {
        const oRpcMethodManager = new RpcMethodManager();
        const oRpcMethod = new RpcMethod('name');

        oRpcMethodManager.addMethod(oRpcMethod);
        assert.isOk(oRpcMethodManager.hasMethod(oRpcMethod));
        assert.strictEqual(oRpcMethodManager.getMethod('name'), oRpcMethod);
        assert.strictEqual(oRpcMethodManager.countMethods(), 1);
    });

    it('RpcMethodManager::removeMethod should throw exception if argument is not an instance of RpcMethod', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {return oRpcMethodManager.removeMethod('invalid');}).to.throw(Error, 'Method must be an instance of "JsonRpc\\RpcMethod"');
    });

    it('RpcMethodManager::removeMethod should remove exactly one RpcMethod', () => {
        const oRpcMethodManager = new RpcMethodManager();
        const oRpcMethod = new RpcMethod('name');

        oRpcMethodManager.addMethod(oRpcMethod);
        assert.isOk(oRpcMethodManager.hasMethod(oRpcMethod));
        assert.strictEqual(oRpcMethodManager.getMethod('name'), oRpcMethod);
        assert.strictEqual(oRpcMethodManager.countMethods(), 1);

        oRpcMethodManager.removeMethod(oRpcMethod);
        assert.isNotOk(oRpcMethodManager.hasMethod(oRpcMethod));
        assert.strictEqual(oRpcMethodManager.countMethods(), 0);
    });

    it('RpcMethodManager::hasMethod should throw exception if argument is not an instance of RpcMethod', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {return oRpcMethodManager.hasMethod('invalid');}).to.throw(Error, 'Method must be an instance of "JsonRpc\\RpcMethod"');
    });

    it('RpcMethodManager::hasMethod should return boolean', () => {
        const oRpcMethodManager = new RpcMethodManager();
        const oRpcMethod = new RpcMethod('name');

        oRpcMethodManager.addMethod(oRpcMethod);
        assert.isOk(oRpcMethodManager.hasMethod(oRpcMethod));

        oRpcMethodManager.removeMethod(oRpcMethod);
        assert.isNotOk(oRpcMethodManager.hasMethod(oRpcMethod));
    });

    it('RpcMethodManager::getMethod should throw exception if argument is not a string', () => {
        const oRpcMethodManager = new RpcMethodManager();
        expect(() => {return oRpcMethodManager.getMethod([]);}).to.throw(Error, 'Argument must be a string');
    });

    it('RpcMethodManager::getMethod should return the RpcMethod or null', () => {
        const oRpcMethodManager = new RpcMethodManager();

        assert.isNull(oRpcMethodManager.getMethod('name'));

        const oRpcMethod = new RpcMethod('name');
        oRpcMethodManager.addMethod(oRpcMethod);
        assert.isOk(oRpcMethodManager.hasMethod(oRpcMethod));

        assert.isNotNull(oRpcMethodManager.getMethod('name'));
        assert.instanceOf(oRpcMethodManager.getMethod('name'), RpcMethod);
    });

    it('RpcMethodManager::getMethods should be an instance of Map', () => {
        const oRpcMethodManager = new RpcMethodManager();
        assert.instanceOf(oRpcMethodManager.getMethods(), Map);
    });

    it('RpcMethodManager::countMethods should return the number of RpcMethods available', () => {
        const oRpcMethodManager = new RpcMethodManager();
        assert.strictEqual(oRpcMethodManager.countMethods(), 0);

        const oRpcMethod = new RpcMethod('name');
        oRpcMethodManager.addMethod(oRpcMethod);
        assert.strictEqual(oRpcMethodManager.countMethods(), 1);

        oRpcMethodManager.removeMethod(oRpcMethod);
        assert.strictEqual(oRpcMethodManager.countMethods(), 0);
    });
});
