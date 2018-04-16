const ipaddr = require('ipaddr.js');

import {getContinentFromCountry} from './data/continents.js';
import SocketAddress from 'common/sockets/socket-address'

import DownloadHelper from "common/utils/helpers/Download-Helper"

class GeoHelper {

    async getLocationFromAddress(address, skipSocketAddress){

        if (!process.env.BROWSER)
            return null;

        if ( skipSocketAddress === undefined) skipSocketAddress = false;

        let sckAddress = null;

        if (!skipSocketAddress) {

            sckAddress = SocketAddress.createSocketAddress(address);
            address = sckAddress.getAddress(false);

            if ( sckAddress._geoLocation !== undefined && sckAddress._geoLocation !== null)
                return sckAddress._geoLocation;
        }

        try{

            let localIP = false;
            if (address.indexOf("192.168") === 0){ // local ip - private network
                address = "";
                localIP = true;
            }

            let list = [];
            list.push("https://freegeoip.net/json/"+address);
            // list.push ( ["https://geoip-db.com/json/"+address,  ]); //don't support domains

            let data = await DownloadHelper.downloadMultipleFiles(list, 30000);

            if (data !== null && data !== undefined){

                let countryCode = '';
                let country = '';
                let continent = '--';

                //console.log("location data", address, data);

                if (data.country !== undefined) country = data.country;
                if (data.country_name !== undefined) country = data.country_name;

                if (data.countryCode !== undefined) countryCode = data.countryCode;
                if (data.country_code !== undefined) countryCode = data.countryCode;

                if (address === '')
                    if (data.query !== undefined) address = address || data.query;

                if (countryCode !== '')
                    continent = getContinentFromCountry(countryCode);

                let geoLocation = {
                    country: country,
                    countryCode: countryCode,
                    city: data.city||'',
                    state: data.state||'',
                    region: data.regionname||data.region_name||'',
                    regionCode: data.regioncode||data.region_code||'',

                    lat: (data.latitude||data.lat||22.2120780) + (localIP ? 0.05* (-1 + 2*Math.random() ) : 0),
                    lng: (data.longitude||data.lng||data.lon||-40.1109744) + (localIP ? 0.05*(-1 + 2*Math.random()) : 0),
                    isp: data.isp,
                    timezone: data.timezone||data.time_zone||'',

                    continent: continent,
                    address: address,
                };

                if (!skipSocketAddress)
                    sckAddress._geoLocation = geoLocation;

                return geoLocation;
            }
        }
        catch(Exception){
            console.error("GeoHelper getLocationFromAddress raised an error ",Exception);
            return null;
        }

    }



}

export default new GeoHelper();