import Method from './RpcMethod';
import {isArray, isString} from 'lodash';

/**
 * Ensure that the specified object is an instance of {@see JsonRpc\RpcMethod}
 *
 * @private
 * @param {RpcMethod} oMethod
 */
const _ensureMethod = (oMethod) => {
    if ((oMethod instanceof Method) === false) {
        throw new Error('Method must be an instance of "JsonRpc\\RpcMethod"');
    }
};

class RpcMethodManager {
    constructor() {
        this._methods = new Map();
    }

    /**
     * @param {RpcMethod[]} aMethods
     */
    addMethods(aMethods = []) {
        if (isArray(aMethods) === false) {
            throw new Error('Argument must be an instance of Array');
        }

        for (const oMethod of aMethods) {
            this.addMethod(oMethod);
        }
    }

    /**
     * @param {RpcMethod} oMethod
     */
    addMethod(oMethod) {
        _ensureMethod(oMethod);

        this._methods.set(oMethod.getName(), oMethod);
    }

    /**
     * @param {RpcMethod} oMethod
     */
    removeMethod(oMethod) {
        _ensureMethod(oMethod);

        if (this.hasMethod(oMethod)) {
            this._methods.delete(oMethod.getName());
        }
    }

    /**
     * @param oMethod
     * @return {boolean}
     */
    hasMethod(oMethod) {
        _ensureMethod(oMethod);
        return this._methods.has(oMethod.getName());
    }

    /**
     * @param {string} sName
     * @return RpcMethod|null
     */
    getMethod(sName) {
        if (isString(sName) === false) {
            throw new Error('Argument must be a string');
        }

        if (this._methods.has(sName) === false) {
            return null;
        }

        return this._methods.get(sName);
    }

    /**
     * @return RpcMethod[]|Map
     */
    getMethods() {
        return this._methods;
    }

    /**
     * @return {number}
     */
    countMethods() {
        return this._methods.size;
    }
}

export default RpcMethodManager;
