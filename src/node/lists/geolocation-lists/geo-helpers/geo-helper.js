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

            let data = await this.downloadFile("http://ip-api.com/json/"+address, 40*1000);
            if (data === null)
                data = await this.downloadFile("http://freegeoip.net/json/"+address, 40*1000);

            if (data !== null){

                let countryCode = '';
                let country = '';
                let continent = '--';

                //console.log("location data", address, data);

                if (!data.country) country = data.country;
                if (!data.country_name) country = data.country_name;

                if (!data.countryCode) countryCode = data.countryCode;
                if (!data.country_code) countryCode = data.countryCode;

                if (countryCode !== '')
                    continent = getContinentFromCountry(countryCode);

                let geoLocation = {
                    country: country,
                    countryCode: countryCode,
                    region: data.regionname||data.region_name||'',
                    regionCode: data.regioncode||data.region_code||'',

                    city: data.city,
                    lat: (data.latitude||data.lat||22.2120780) + (localIP ? 0.05* (-1 + 2*Math.random() ) : 0),
                    lng: (data.longitude||data.lng||data.lon||-40.1109744) + (localIP ? 0.05*(-1 + 2*Math.random()) : 0),
                    isp: data.isp,
                    timezone: data.timezone||data.time_zone||'',

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

    async downloadFile(address, timeout){
        try{
            let axiosInstance = axios.create({
                timeout: timeout,
            });

            let response = await axiosInstance.get(address);
            if (response === null) return null;

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