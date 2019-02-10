import {RpcMethod} from './../../../jsonRpc';

/**
 * The current webdollar protocol version.
 */
class ProtocolVersion extends RpcMethod {
    constructor(name, version) {
        super(name);

        this._sVersion = version;
    }

    getHandler() {
        return this._sVersion;
    }
}

export default ProtocolVersion;
