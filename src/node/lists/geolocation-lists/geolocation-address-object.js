const ipaddr = require('ipaddr.js');
const SocketAddress = require('./../../../common/sockets/socket-address.js');

/*
    TUTORIAL BASED ON https://www.npmjs.com/package/ipaddr.js/
 */

class GeoLocationAddressObject  {

    /*
        sckAddress = Null
        lastTimeChecked = 0
        location = {}
     */

    constructor(sckAddress, port, location){

        if (typeof location === 'undefined') location = {}

        sckAddress = SocketAddress.createSocketAddress(sckAddress, port);
        this.sckAddress = sckAddress;

        this.lastTimeChecked = 0;
        this.location = location;
    }


    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(minimumDifferenceInMs){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= minimumDifferenceInMs)
            return true;

        return false;
    }

    toString(){
        return this.sckAddress.toString();
    }

}

exports.GeoLocationAddressObject = GeoLocationAddressObject;