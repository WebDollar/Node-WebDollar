const axios = require('axios');
const ipaddr = require('ipaddr.js');
import {getContinentFromCountry} from './data/continents.js';
import {SocketAddress} from './../../../../common/sockets/socket-address';

class GeoHelper {

    constructor(){
    }

    async getLocationFromAddress(address, skipSocketAddress){

        if (typeof skipSocketAddress === 'undefined') skipSocketAddress = false;

        let sckAddress = null;

        if (!skipSocketAddress) {
            sckAddress = SocketAddress.createSocketAddress(address);
            address = sckAddress.getAddress(false);

            if (typeof sckAddress.geoLocation !== 'undefined' && sckAddress.geoLocation !== null)
                return sckAddress.geoLocation;
        }

        try{

            let localIP = false;
            if (address.indexOf("192.168") === 0){ // local ip - private network
                address = "";
                localIP = true;
            }

            let data = await this.downloadFile("http://ip-api.com/json/"+address);
            if (data !== null){

                let countryCode = '';
                let country = '';
                let continent = '--';

                //console.log("location data", address, data);

                if (data.hasOwnProperty('country')){
                    country = data.country;
                }

                if (data.hasOwnProperty('countryCode')){
                    countryCode = data.countryCode;

                    continent = getContinentFromCountry(countryCode);
                }

                let geoLocation = {
                    country: country,
                    city: data.city,
                    lat: (data.latitude||data.lat||22.2120780) + (localIP ? 0.2* (-1 + 2*Math.random() ) : 0),
                    lng: (data.longitude||data.lng||data.lon||-40.1109744) + (localIP ? 0.2*(-1 + 2*Math.random()) : 0),
                    isp: data.isp,
                    timezone: data.timezone,
                    countryCode: countryCode,
                    continent: continent,
                };

                if (!skipSocketAddress)
                    sckAddress.geoLocation = geoLocation;

                return geoLocation;
            }
        }
        catch(Exception){
            console.log(Exception.toString());
            return null;
        }

    }

    async downloadFile(address){
        try{
            let response = await axios.get(address);

            let data = response.data;

            if (typeof data === 'string') data = JSON.parse(data);

            if (typeof data === 'object') return data;

            return null;
        }
        catch(Exception){
            console.log("ERROR downloading list: ", address);
            console.log(Exception.toString());
            return null;
        }
    }

}

exports.GeoHelper =  new GeoHelper();