import {RpcMethod} from './../../../jsonRpc';
import consts from './../../../consts/const_global';

/**
 * The current webdollar protocol version.
 */
class ProtocolVersion extends RpcMethod
{
    constructor(name) {
        super(name);
    }

    getHandler(args) {
        return consts.SETTINGS.NODE.VERSION;
    }
}

export default ProtocolVersion;
