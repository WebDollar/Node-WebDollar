import Method from "./RpcMethod";

/**
 * Ensure that the specified object is an instance of {@see JsonRpc\RpcMethod}
 *
 * @private
 * @param oMethod
 * @private
 */
const _ensureMethod = (oMethod) => {
    if ((oMethod instanceof Method) === false)
    {
        throw new Error('Method must be an instance of "JsonRpc\\RpcMethod"');
    }
};

class RpcMethodManager
{
    constructor() {
        this._methods = new Map();
    }

    addMethods(aMethods = []) {
        for (let i in aMethods)
        {
            this.addMethod(aMethods[i]);
        }
    }

    addMethod(oMethod) {
        _ensureMethod(oMethod);

        this._methods.set(oMethod.getName(), oMethod);
    }

    removeMethod(oMethod) {
        _ensureMethod(oMethod);

        if (this.hasMethod(oMethod))
        {
            this._methods.delete(oMethod.getName());
        }
    }

    hasMethod(oMethod) {
        _ensureMethod(oMethod);
        return this._methods.has(oMethod.getName());
    }

    getMethod(sName) {
        return this._methods.get(sName);
    }

    getMethods() {
        return this._methods;
    }
}

export default RpcMethodManager;
