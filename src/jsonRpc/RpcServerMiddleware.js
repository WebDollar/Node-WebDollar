import * as jayson from 'jayson/promise'
import MethodManager from "./MethodManager";

class RpcServerMiddleware
{
    constructor(oMethodManager) {
        this._isInitialized = false;
        this.setMethodManager(oMethodManager);
    }

    getMethodManager() {
        return this._oMethodManager;
    }

    setMethodManager(oMethodManager) {
        if (!(oMethodManager instanceof MethodManager))
        {
            throw new Error('MethodManager must be an instance of JsonRpc\\MethodManager')
        }

        this._oMethodManager = oMethodManager;
    }

    getMiddleware() {
        if (this._isInitialized)
        {
            return;
        }

        const oServer = jayson.server()

        for (let [methodName, oMethod] of this.getMethodManager().getMethods().entries())
        {
            oServer.method(methodName, new jayson.Method({
                handler: function(args) {
                    return new Promise((resolve, reject) => {
                        try
                        {
                            resolve(oMethod.getHandler(args))
                        }
                        catch (e)
                        {
                            reject(oServer.error(null, null, {details: e.message || null}));
                        }
                    });
                },
                collect: true,
                params: oMethod.getParamType() || Array
            }));
        }

        this._isInitialized = true;

        return oServer.middleware();
    }
}

export default RpcServerMiddleware;
