const axios = require('axios');
import {getContinentFromCountry} from './continents.js';

class GeoLocationLists {

    /*
        geoLocationContinentsLists = []
        countGeoLocationContinentsLists = 0
     */

    constructor(){

        console.log("GeoLocations constructor");

        this.geoLocationContinentsLists = [];
        this.countGeoLocationContinentsLists = 0;
    }

    async includeAddress(socket){

        //in case the location has been set before  (avoiding double insertion)
        if ((typeof socket.location !== 'undefined') && (socket.location !== null) && (this.searchGeoLocationByAddress(socket.request.connection.remoteAddress) !== null)) return socket.location;

        let location = await this.getLocationFromAddress(address);
        location.continent = location.continent || '--';

        socket.location = location;

        this.geoLocationContinentsLists[location.continent] = address;
        this.countGeoLocationContinentsLists += 1;

    }

    searchGeoLocationByAddress(address){
        for (let continent in this.geoLocationContinentsLists)
            if (this.geoLocationContinentsLists[continent] === address)
                return continent;

        return null;
    }

    async getLocationFromAddress(address){

        try{
            let data = await this.downloadFile("http://ip-api.com/json/"+address);
            if (data !== null){

                let countryCode = '';
                let country = '';
                let continent = '--';

                if (data.hasOwnProperty(country)){
                    country = data.country;
                }

                if (data.hasOwnProperty(countryCode)){
                    countryCode = data.countryCode;

                    if (continent === '--')
                        continent = getContinentFromCountry(countryCode);
                }

                return {
                    country: country,
                    countryCode: countryCode,
                    continent: continent,
                };
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

            if (response.type === 'json'){
                return response.data;
            }
        }
        catch(Exception){
            console.log("ERROR downloading list: ", address);
            console.log(Exception.toString());
            return null;
        }
    }



}

exports.GeoLocationLists =  new GeoLocationLists();