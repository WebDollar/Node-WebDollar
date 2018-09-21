const ipaddr = require('ipaddr.js');

import {getContinentFromCountry} from './data/continents.js';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'

import consts from 'consts/const_global'
import DownloadHelper from "common/utils/helpers/Download-Helper"
import Utils from "common/utils/helpers/Utils";

class GeoHelper {

    async getLocationFromAddress(address, skipSocketAddress){

        if (consts.SETTINGS.GEO_IP_ENABLED === false) return;

        if ( skipSocketAddress === undefined) skipSocketAddress = false;

        let sckAddress = null;

        if (!skipSocketAddress) {

            sckAddress = SocketAddress.createSocketAddress(address);
            address = sckAddress.getAddress(false);

            if ( sckAddress._geoLocation.isFulfilled() )
                return sckAddress._geoLocation;
        }

        try{

            let localIP = false;
            if (address.indexOf("192.168") === 0){ // local ip - private network
                address = "";
                localIP = true;
            }

            let list = [];
            list.push("https://geoip.tools/v1/json/?q="+address);
            // list.push ( ["https://geoip-db.com/json/"+address,  ]); //don't support domains

            let data = await DownloadHelper.downloadMultipleFiles( list, 20000 );

            if (data !== null && data !== undefined){

                let countryCode = '';
                let country = '';
                let continent = '--';

                //console.log("location data", address, data);

                if (data.country !== undefined) country = data.country;
                if (data.country_name !== undefined) country = data.country_name;

                if (data.countryCode !== undefined) countryCode = data.countryCode;
                if (data.country_code !== undefined) countryCode = data.country_code;

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
                    sckAddress._geoLocationResolver( geoLocation );


                return geoLocation;

            } else throw {message: "error downloading data"};

        }
        catch(Exception){
            console.error("GeoHelper getLocationFromAddress raised an error ",Exception);

            return {
                country: '',
                countryCode: '',
                city: '',
                state: '',
                region: '',
                regionCode: '',

                lat: (22.2120780),
                lng: (-40.1109744),
                isp: '',
                timezone: '',

                continent: '',
                address: address,
            };
        }

    }



}

export default new GeoHelper();
