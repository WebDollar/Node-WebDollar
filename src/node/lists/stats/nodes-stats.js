import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'
import GeoLocationLists from 'node/lists/geolocation-lists/geolocation-lists'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import ConnectionsType from "node/lists/types/Connections-Type"

class NodesStats {

    // socket : null,

    constructor(){

        this.statsClients = 0;
        this.statsServer = 0;
        this.statsWebPeers = 0;
        this.statsWaitlist = 0;

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => { this._recalculateStats(nodesListObject) } );
        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject ) => { this._recalculateStats(nodesListObject ) });

        NodesWaitlist.emitter.on("waitlist/new-node", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });
        NodesWaitlist.emitter.on("waitlist/delete-node", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });

        setInterval( () => { return this._printStats() }, consts.SETTINGS.PARAMS.STATUS_INTERVAL)
    }


    _printStats(){

        console.log(" connected to: ", this.statsClients," , from: ", this.statsServer , " web peers", this.statsWebPeers," Waitlist:",this.statsWaitlist,  "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists );

        let string1 = "";
        let clients = NodesList.getNodes(ConnectionsType.CONNECTION_CLIENT_SOCKET);
        for (let i=0; i<clients.length; i++)
            string1 += '('+clients[i].socket.node.sckAddress.getOriginalAddress()+' , '+clients[i].socket.node.sckAddress.uuid+')   ';

        let string2 = "";
        let server = NodesList.getNodes( ConnectionsType.CONNECTION_SERVER_SOCKET );
        for (let i=0; i<server.length; i++)
            string2 += '(' + server[i].socket.node.sckAddress.getOriginalAddress() + ' , ' + server[i].socket.node.sckAddress.uuid + ')   ';

        console.log("clients: ",string1);
        console.log("server: ",string2);

    }

    _recalculateStats(nodesListObject, printStats = true){

        this.statsClients = NodesList.countNodes(ConnectionsType.CONNECTION_CLIENT_SOCKET);
        this.statsServer = NodesList.countNodes(ConnectionsType.CONNECTION_SERVER_SOCKET);
        this.statsWebPeers = NodesList.countNodes(ConnectionsType.CONNECTION_WEBRTC);
        this.statsWaitlist = NodesWaitlist.waitlist.length;

        if (printStats)
            this._printStats();

    }
}

export default new NodesStats();