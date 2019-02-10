import {RpcMethod}      from './../../../jsonRpc';
import CONNECTIONS_TYPE from './../../../node/lists/types/Connection-Type';

/**
 * The current number of peers connected to the client.
 */
class PeerCount extends RpcMethod {
    constructor(name, oNodesList) {
        super(name);

        this._oNodesList = oNodesList;
    }

    getHandler() {
        return {
            clients : this._oNodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET),
            servers : this._oNodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET),
            webpeers: this._oNodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC),
        };
    }
}

export default PeerCount;
