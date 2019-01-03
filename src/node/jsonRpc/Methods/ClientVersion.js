import {RpcMethod} from './../../../jsonRpc';

/**
 * The current version of the client
 */
class ClientVersion extends RpcMethod
{
    constructor(name, version) {
        super(name);
        this._nVersion = version;
    }


    getHandler(args) {
        return this._nVersion;
    }
}

export default ClientVersion;
