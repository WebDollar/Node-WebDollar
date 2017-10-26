import {nodeStatusInterval} from '../../../consts/const_global.js';
import {NodeLists} from '../node-lists.js';
import {GeoLocationLists} from '../geolocation-lists/geolocation-lists.js';
import {NodeWaitlist} from '../waitlist/node-waitlist';

class NodeStats {

    // socket : null,

    constructor(){

        let that = this;
        setInterval(function (){ return that.printStats() }, nodeStatusInterval)

    }


    printStats(){

        let clientSockets = NodeLists.getNodes("client").length;
        let serverSockets = NodeLists.getNodes("server").length;
        let webPeers = NodeLists.getNodes("webpeer").length;
        let waitlistCount = NodeWaitlist.waitlist.length;

        console.log(" connected to: ", clientSockets," , from: ", serverSockets, " web peers", webPeers," Waitlist:",waitlistCount,  "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists);
    }
}

exports.NodeStats = new NodeStats();