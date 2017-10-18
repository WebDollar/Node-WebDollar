let ioClient = require('socket.io-client');

import {nodeStatusInterval} from '../../consts/const_global.js';
import {NodeLists} from './../lists/node-lists.js';
import {GeoLocationLists} from './../lists/geolocation-lists/geolocation-lists.js';

class NodeStats {

    // socket : null,

    constructor(){

        let that = this;
        setInterval(function (){ return that.printStats() }, nodeStatusInterval)

    }


    printStats(){

        let clientSockets = NodeLists.clientSockets.length;
        let serverSockets = NodeLists.serverSockets.length;

        console.log(" connected to: ", clientSockets," , from: ", serverSockets, " GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists);

    }

}

exports.NodeStats = new NodeStats();