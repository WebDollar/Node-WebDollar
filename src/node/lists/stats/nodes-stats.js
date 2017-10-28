import {nodeStatusInterval} from '../../../consts/const_global.js';
import {NodesList} from '../nodes-list.js';
import {GeoLocationLists} from '../geolocation-lists/geolocation-lists.js';
import {NodesWaitlist} from '../waitlist/nodes-waitlist';

class NodesStats {

    // socket : null,

    constructor(){

        let that = this;
        setInterval(function (){ return that.printStats() }, nodeStatusInterval)

    }


    printStats(){

        let clientSockets = NodesList.getNodes("client").length;
        let serverSockets = NodesList.getNodes("server").length;
        let webPeers = NodesList.getNodes("webpeer").length;
        let waitlistCount = NodesWaitlist.waitlist.length;

        console.log(" connected to: ", clientSockets," , from: ", serverSockets, " web peers", webPeers," Waitlist:",waitlistCount,  "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists);
        //console.log(NodesList.getNodes("client"), NodesList.getNodes("server"))
    }
}

exports.NodesStats = new NodesStats();