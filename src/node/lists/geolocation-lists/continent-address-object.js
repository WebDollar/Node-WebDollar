const ipaddr = require('ipaddr.js');

/*
    TUTORIAL BASED ON https://www.npmjs.com/package/ipaddr.js/
 */

class ContinentAddressObject  {

    constructor(address, addressByteArray){

        try {
            if (typeof addressByteArray !== 'undefined') {
                this.address = ipaddr.fromByteArray(addressByteArray);
            }
            else {
                this.address = ipaddr.parse(address);
            }
        } catch (Exception){
            this.address = address;
        }
        this.addressString = this.address.toString();

        this.lastTimeChecked = 0;
    }

    matchAddress(address){

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
        if (typeof this.address === 'object')  return this.address.toNormalizedString();
        return this.address;
    }

}

exports.ContinentAddressObject = ContinentAddressObject;