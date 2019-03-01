const ipaddr = require('ipaddr.js');

import {getContinentFromCountry} from './data/continents.js';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'

import consts from 'consts/const_global'
import DownloadHelper from "common/utils/helpers/Download-Helper"
import Utils from "common/utils/helpers/Utils";

class GeoHelper {

    async getLocationFromAddress(address, skipSocketAddress){

        if (consts.SETTINGS.GEO_IP_ENABLED === false) return;

        if ( !skipSocketAddress ) skipSocketAddress = false;

        let sckAddress = null;

        if (!skipSocketAddress) {

            sckAddress = SocketAddress.createSocketAddress(address);
            address = sckAddress.getAddress(false);

            if ( sckAddress._geoLocation.isFulfilled() )
                return sckAddress._geoLocation;
        }


        let result = {
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


        try{

            let localIP = false;
            if (address.indexOf("192.168") === 0){ // local ip - private network
                address = "";
                localIP = true;
            }

            let list = [];
            // list.push("https://ipstack.com/ipstack_api.php?ip="+address);
            list.push("https://geo.xoip.ro/?address="+address); //@Sorin' version
            // list.push("https://geoip.tools/v1/json/?q="+address);
            // list.push ( ["https://geoip-db.com/json/"+address,  ]); //don't support domains

            let data = await DownloadHelper.downloadMultipleFiles( list, 20000 );

            if (data){

                if (data.length === 1) data = data[0];

                //console.log("location data", address, data);

                result.country = data.country || data.country_name;
                result.countryCode = data.countryCode || data.country_code;

                if (address === '')
                    if (data.query ) result.address = address || data.query;

                if (result.countryCode )
                    result.continent = getContinentFromCountry(result.countryCode);

                result.city = data.city||'';
                result.state = data.state||'';
                result.region = data.regionname||data.region_name||'';
                result.regionCode = data.regioncode||data.region_code||'';
                result.lat = (data.latitude||data.lat||22.2120780) + (localIP ? 0.05* (-1 + 2*Math.random() ) : 0);
                result.lng = (data.longitude||data.lng||data.lon||-40.1109744) + (localIP ? 0.05*(-1 + 2*Math.random()) : 0);
                result.timezone = data.timezone||data.time_zone||'';

                if (!skipSocketAddress)
                    sckAddress._geoLocationResolver( result );

            }

        }
        catch(Exception){
            console.error("GeoHelper getLocationFromAddress raised an error ",Exception);
        }

        return result;

    }



}

export default new GeoHelper();
