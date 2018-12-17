import {RpcMethod} from './../../../jsonRpc';

/**
 * The current network
 */
class NetVersion extends RpcMethod
{
    constructor(name, network) {
        super(name);
        this._network = network;
    }


    getHandler(args) {
        return {
            id  : this._network.id,
            name: this._network.name,
        };
    }
}

export default NetVersion;
