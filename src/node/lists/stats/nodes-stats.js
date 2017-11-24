import {nodeStatusInterval} from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'
import GeoLocationLists from 'node/lists/geolocation-lists/geolocation-lists'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'

class NodesStats {

    // socket : null,

    constructor(){

        this.statsClients = 0;
        this.statsServer = 0;
        this.statsWebPeers = 0;
        this.statsWaitlist = 0;

        NodesList.registerEvent("connected", {type: ["all"]}, (err, result) => { this._recalculateStats(err, result) } );
        NodesList.registerEvent("disconnected", {type: ["all"]}, (err, result ) => { this._recalculateStats(err, result ) });

        NodesWaitlist.registerEvent("new-node-waitlist", {type: ["all"]}, (err, result ) => { this._recalculateStats(err, result ) });

        setInterval( () => { return this._printStats() }, nodeStatusInterval)
    }


    _printStats(){

        console.log(" connected to: ", this.statsClients," , from: ", this.statsServer , " web peers", this.statsWebPeers," Waitlist:",this.statsWaitlist,  "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists);
    }

    _recalculateStats(err, object){

        this.statsClients = NodesList.getNodes("client").length;
        this.statsServer = NodesList.getNodes("server").length;
        this.statsWebPeers = NodesList.getNodes("webpeer").length;
        this.statsWaitlist = NodesWaitlist.waitlist.length;

        this._printStats();

    }
}

export default new NodesStats();