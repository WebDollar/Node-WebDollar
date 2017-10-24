const ipaddr = require('ipaddr.js');

class SocketAddress {

    static checkIsSocketAddress(sckAddress){
        if (typeof sckAddress !== 'object') return false;

        if (! (sckAddress.hasOwnProperty("address") && sckAddress.hasOwnProperty("addressString") && sckAddress.hasOwnProperty("port"))) return false;

        return true;
    }

    static createSocketAddress(sckAddress, port){
        if (SocketAddress.checkIsSocketAddress(sckAddress)) return sckAddress;
    }


    constructor(address, port){

        if (typeof address === 'undefined') address = '';
        if (typeof address === 'string') address = address.toLowerCase();

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
    }

    matchAddress(address){

        //maybe it is a socket
        if (typeof address === "object" && address.hasOwnProperty("sckAddress") )
            address = address.sckAddress;

        try{
            if (typeof address === 'string') address = ipaddr.parse(address);
        } catch (Exception){

        }

        let myAddressString = this.address.toString();
        if (typeof this.address === 'object')  myAddressString = this.address.toNormalizedString();

        let addressString = address.toString();
        if (typeof address === 'object')  addressString = address.toNormalizedString();

        return ( myAddressString === addressString )
    }

    toString(){
        if (typeof this.address === 'object')  return this.address.toNormalizedString();
        return this.address;
    }

}

exports.SocketAddress = SocketAddress;