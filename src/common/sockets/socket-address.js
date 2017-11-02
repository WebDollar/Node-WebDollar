const ipaddr = require('ipaddr.js');
import {nodePort} from './../../consts/const_global.js';
import {GeoHelper} from './../../node/lists/geolocation-lists/geo-helpers/geo-helper';

class SocketAddress {

    static checkIsSocketAddress(sckAddress){

        //console.log("checkIsSocketAddress", sckAddress);

        if (typeof sckAddress !== 'object' || sckAddress === null) return false;

        if (! (sckAddress.constructor.name === "SocketAddress" )) return false;

        return true;
    }

    /*
        Create a Socket Address in case the address is just a simple "address"
     */
    static createSocketAddress(address, port){

        //in case address is actually a Socket
        if (typeof address === "object" && address !== null && address.hasOwnProperty("node") && address.node.hasOwnProperty("sckAddress")) address = address.node.sckAddress;
        if (typeof address === "object" && address !== null && address.hasOwnProperty("sckAddress")) address = address.sckAddress;

        if (SocketAddress.checkIsSocketAddress(address)) return address;

        if ( typeof port === 'undefined' || port === '') port = nodePort;
        return new SocketAddress(address, port);
    }


    constructor(address, port){

        if (typeof address === 'undefined') address = '';
        if (typeof address === 'string') address = address.toLowerCase();

        if (typeof port === 'undefined') port = nodePort;

        try {
            if (typeof address === 'string')
                address = ipaddr.parse(address);
            else
            if (Array.isArray(address))
                address = ipaddr.fromByteArray(address);

        } catch (Exception){
        }

        this.addressString = address.toString();
        this.address = address;
        this.port = port;
        this.geoLocation = null;
    }

    matchAddress(address){
        //maybe it is a socket
        let sckAddress = SocketAddress.createSocketAddress(address);

        let myAddressString = this.getAddress(false);
        let addressString = sckAddress.getAddress(false);

        return ( myAddressString === addressString )
    }

    toString(){
        if (typeof this.address === 'object')  return this.address.toNormalizedString();
        return this.address;
    }

    getAddress(includePort){

        try {
            if (typeof includePort === 'undefined') includePort = true;

            if (typeof this.address === 'object') return this.address.toNormalizedString() + (includePort ? ':' + this.port : '');

            return this.address.toString() + (includePort ? ':'+this.port : '');

        } catch(Exception){
            console.log("getAddress exception", Exception.toString(), this.address);
        }
    }

    getGeoLocation(){
        if (this.geoLocation !== null) return (this.geoLocation); //already computed

        return GeoHelper.getLocationFromAddress(this);

    }

}

exports.SocketAddress = SocketAddress;