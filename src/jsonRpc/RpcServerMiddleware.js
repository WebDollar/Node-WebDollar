import * as jayson from 'jayson/promise';
import RpcMethodManager from "./RpcMethodManager";

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
        if (!(oMethodManager instanceof RpcMethodManager))
        {
            throw new Error('MethodManager must be an instance of JsonRpc\\RpcMethodManager');
        }

        this._oMethodManager = oMethodManager;
    }

    getMiddleware(bServerIsSecured) {
        if (this._isInitialized)
        {
            return;
        }

        const oServer = jayson.server();

        for (let [methodName, oMethod] of this.getMethodManager().getMethods().entries())
        {
            oServer.method(methodName, new jayson.Method({
                handler: function(args) {
                    return new Promise((resolve, reject) => {
                        if (bServerIsSecured === false && oMethod.isPrivate())
                        {
                            return reject(oServer.error(401, 'You must be authenticated and the server to have the Authentication enabled in order to access the method "' + oMethod.getName() + '"'));
                        }

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
