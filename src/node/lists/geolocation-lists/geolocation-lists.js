const axios = require('axios');
import {getContinentFromCountry} from './continents.js';

class GeolocationLists {

    /*
        geolocationContinentsLists = []
     */

    constructor(){

        console.log("GeoLocations constructor");

        this.geolocationContinentsLists = [];
    }

    async includeAddress(address){

        let location = await this.getLocationFromAddress(address);
        this.geolocationContinentsLists[location.continent||'--'] = address;

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

exports.GeolocationLists =  new GeolocationLists();