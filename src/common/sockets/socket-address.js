const ipaddr = require('ipaddr.js');
import consts from 'consts/const_global'
import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'

class SocketAddress {

    static checkIsSocketAddress(sckAddress){

        //console.log("checkIsSocketAddress", sckAddress);

        if (typeof sckAddress !== 'object' || sckAddress === null)
            return false;

        if (! (sckAddress.constructor.name === "SocketAddress" ))
            return false;

        return true;
    }

    /*
        Create a Socket Address in case the address is just a simple "address"
     */
    static createSocketAddress(address, port, uuid){

        //in case address is actually a Socket
        if (typeof address === "object" && address !== null && address.hasOwnProperty("node") && address.node.hasOwnProperty("sckAddress"))
            address = address.node.sckAddress;

        if (typeof address === "object" && address !== null && address.hasOwnProperty("sckAddress"))
            address = address.sckAddress;

        if (SocketAddress.checkIsSocketAddress(address))
            return address;

        if (  port === undefined || port === '')
            port = consts.SETTINGS.NODE.PORT;

        return new SocketAddress(address, port, uuid);
    }


    constructor(address, port, uuid){

        if (address === undefined)
            address = '';
        
        if (typeof address === 'string')
            address = address.toLowerCase();

        if (port === undefined)
            port = consts.SETTINGS.NODE.PORT;

        if (typeof address === 'string') {
            if (address.lastIndexOf(":")>0) {
                port = address.substr(address.lastIndexOf(":")+1)
                address = address.substr(0, address.lastIndexOf(":"));
            }
        }

        this._originalAddress = address;

        try {
            if (typeof address === 'string')
                address = ipaddr.parse(address);
            else
            if (Array.isArray(address))
                address = ipaddr.fromByteArray(address);

        } catch (Exception){

        }


        this.address = address;
        this.port = port;
        this._geoLocation = null;

        this.uuid = uuid;
    }

    matchAddress(address, validationDoubleConnectionsTypes){

        if (validationDoubleConnectionsTypes === undefined)
            validationDoubleConnectionsTypes = ["ip","uuid"];
        else
        if (!Array.isArray(validationDoubleConnectionsTypes))
            validationDoubleConnectionsTypes = [validationDoubleConnectionsTypes];

        //maybe it is a socket
        let sckAddress = SocketAddress.createSocketAddress(address);

        //uuid validation
        if ( validationDoubleConnectionsTypes.indexOf("uuid") >= 0 ){

            if (this.uuid !== null && this.uuid !== undefined && this.uuid === sckAddress.uuid)
                return true;

        }

        //ip validation
        if ( validationDoubleConnectionsTypes.indexOf("ip") >=0 ){

            let myAddressString = this.getAddress(false);
            let addressString = sckAddress.getAddress(false);

            if ( myAddressString === addressString ) return true;
        }

        return false;
    }

    /*
        return nice looking ip addresses
     */
    toString(){
        return this.getAddress(false);
    }

    /*
        returns ipv6 ip standard
     */
    getAddress(includePort){

        try {
            if ( includePort === undefined)
                includePort = true;

            if (typeof this.address === 'object') {

                let initialAddress;

                if (typeof this.address === "string") initialAddress = this.address;
                else initialAddress = this.address.toNormalizedString();

                let addressString =  '';

                //avoiding ipv4 shows as ipv6
                if (ipaddr.IPv4.isValid(initialAddress)) {
                    // ipString is IPv4
                    addressString = initialAddress;
                } else if (ipaddr.IPv6.isValid(initialAddress)) {
                    let ip = ipaddr.IPv6.parse(initialAddress);
                    if (ip.isIPv4MappedAddress()) {
                        // ip.toIPv4Address().toString() is IPv4
                        addressString = ip.toIPv4Address().toString();
                    } else {
                        // ipString is IPv6
                        addressString = initialAddress;
                    }
                } else {
                    // ipString is invalid
                    throw {message: "NO VALID IP", address: this.address};
                }


                return addressString + (includePort ? ':' + this.port : '');
            }

            let initialAddress;

            if (typeof this.address === "string") initialAddress = this.address;
            else initialAddress = this.address.toNormalizedString();

            return initialAddress + (includePort ? ':'+this.port : '');

        } catch(Exception){
            console.error("getAddress exception", Exception, this.address);
            return '';
        }
    }

    getOriginalAddress(){
        return this._originalAddress;
    }

    get geoLocation(){

        if (this._geoLocation !== null) //already computed
            return this._geoLocation;

        this._geoLocation = new Promise( async (resolve)=>{

            let answer = await GeoHelper.getLocationFromAddress(this);

            if (answer === null) resolve(null);
            else {
                this._geoLocation = answer;
                resolve(answer);
            }

        });

        return this._geoLocation;

    }

    isLocalHost(){

        return false;

        try{

            let address = this.getAddress(false);

            if (address.indexOf("127.0.0.1") >= 0 || address.indexOf("localhost") >= 0)
                return true;

            if (address.indexOf("::1") >= 0)
                return true;

            if (address.indexOf("::") >= 0)
                return true;

            return false;

        } catch (Exception){
            throw {message: "EXCEPTION isLocalHost", address: this.address}
        }

    }

}

export default SocketAddress;