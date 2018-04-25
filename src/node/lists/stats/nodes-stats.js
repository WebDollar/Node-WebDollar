import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'
import GeoLocationLists from 'node/lists/geolocation-lists/geolocation-lists'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"

class NodesStats {

    // socket : null,

    constructor(){

        this.statsClients = 0;
        this.statsServer = 0;
        this.statsWebPeers = 0;

        this.statsWaitlistFullNodes = 0;
        this.statsWaitlistLightNodes = 0;

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => { this._recalculateStats(nodesListObject, false ) } );
        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });

        NodesWaitlist.emitter.on("waitlist/new-node", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });
        NodesWaitlist.emitter.on("waitlist/delete-node", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });

        setInterval( this._printStats.bind(this), consts.SETTINGS.PARAMS.STATUS_INTERVAL)
    }

    _printStats(){

        console.log(" connected to: ", this.statsClients," , from: ", this.statsServer , " web peers", this.statsWebPeers," Network FullNodes:",this.statsWaitlistFullNodes, " Network LightNodes:",this.statsWaitlistLightNodes, "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists );


        let string1 = "";
        let clients = NodesList.getNodes(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET);
        for (let i=0; i<clients.length; i++)
            string1 += '('+clients[i].socket.node.sckAddress.toString() + ')   ';

        let string2 = "";
        let server = NodesList.getNodes( CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET );
        for (let i=0; i<server.length; i++)
            string2 += '(' + server[i].socket.node.sckAddress.toString() + ')   ';

        console.log("clients: ",string1);
        console.log("server: ",string2);

    }

    _recalculateStats(nodesListObject, printStats = true){

        this.statsClients = NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET);
        this.statsServer = NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET);
        this.statsWebPeers = NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC);

        this.statsWaitlistFullNodes= NodesWaitlist.waitListFullNodes.length;
        this.statsWaitlistLightNodes = NodesWaitlist.waitListLightNodes.length;

        if (printStats)
            this._printStats();

    }
}

export default new NodesStats();