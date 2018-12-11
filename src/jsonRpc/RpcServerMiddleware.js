import RpcMethodManager from './RpcMethodManager';
const jayson = require('jayson/promise');

class RpcServerMiddleware
{
    /**
     * @param {RpcMethodManager} oMethodManager
     */
    constructor(oMethodManager) {
        this._oMiddleware = null;
        this.setMethodManager(oMethodManager);
    }

    /**
     * @return {RpcMethodManager}
     */
    getMethodManager() {
        return this._oMethodManager;
    }

    /**
     * @param {RpcMethodManager} oMethodManager
     * @throws Error
     */
    setMethodManager(oMethodManager) {
        if (!(oMethodManager instanceof RpcMethodManager))
        {
            throw new Error('MethodManager must be an instance of JsonRpc\\RpcMethodManager');
        }

        this._oMethodManager = oMethodManager;
    }

    /**
     * @param {boolean} bServerIsSecured
     * @return {Middleware}
     */
    getMiddleware(bServerIsSecured) {
        if (this._oMiddleware !== null)
        {
            return this._oMiddleware;
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
                            return resolve(oMethod.getHandler(args));
                        }
                        catch (e)
                        {
                            return reject(oServer.error(null, null, {details: e.message || null}));
                        }
                    });
                },
                collect: true,
                params: oMethod.getParamType() || Array
            }));
        }

        return this._oMiddleware = oServer.middleware();
    }
}

export default RpcServerMiddleware;
