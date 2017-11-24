const ipaddr = require('ipaddr.js');
import SocketAddress from 'common/sockets/socket-address'

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
        return this.sckAddress.getAddress();
    }

}

export default GeoLocationAddressObject;