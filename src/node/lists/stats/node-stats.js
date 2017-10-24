import {nodeStatusInterval} from '../../../consts/const_global.js';
import {NodeLists} from '../node-lists.js';
import {GeoLocationLists} from '../geolocation-lists/geolocation-lists.js';

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

        console.log(" connected to: ", clientSockets," , from: ", serverSockets, " web peers", webPeers,  "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists);
    }
}

exports.NodeStats = new NodeStats();