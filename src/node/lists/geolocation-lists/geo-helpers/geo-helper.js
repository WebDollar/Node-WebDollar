const axios = require('axios');
const ipaddr = require('ipaddr.js');
import {getContinentFromCountry} from './data/continents.js';
import {SocketAddress} from './../../../../common/sockets/socket-address';

class GeoHelper {

    constructor(){
    }

    async getLocationFromAddress(address){

        let sckAddress = SocketAddress.createSocketAddress(address);
        address = sckAddress.getAddress(false);

        if (typeof sckAddress.geoLocation !== 'undefined')
            return sckAddress.geoLocation;

        try{
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
                    lat: data.latitude||data.lat,
                    lng: data.longitude||data.lng||data.lat,
                    org: data.org,
                    timezone: data.timezone,
                    countryCode: countryCode,
                    continent: continent,
                };

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