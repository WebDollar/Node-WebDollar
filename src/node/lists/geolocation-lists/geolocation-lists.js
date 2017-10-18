const axios = require('axios');
import {getContinentFromCountry} from './continents.js';

class GeoLocationLists {

    /*
        geoLocationContinentsLists = {}
        countGeoLocationContinentsLists = 0
     */

    constructor(){

        console.log("GeoLocations constructor");

        this.geoLocationContinentsLists = {};
        this.geoLocationLists = [];

        this.countGeoLocationContinentsLists = 0;
    }

    async includeAddress(address){

        let location = await this.getLocationFromAddress(address);
        if (location === null){
            console.log("LOCATION was not been able to get");
            return null;
        }
        location.continent = location.continent || '--';

        this.addGeoLocationContinentByAddress(address, location);

        return location;
    }

    async includeSocket(socket){

        if (socket === null) return null;

        //in case the location has been set before  (avoiding double insertion)
        if ((typeof socket.location !== 'undefined') && (socket.location !== null)) return socket.location;

        let location = await this.includeAddress(socket.address);
        socket.location = location;
        return location;
    }

    addGeoLocationContinentByAddress(address, location){

        //console.log(this.geoLocationContinentsLists); console.log(address);

        if (this.searchGeoLocationContinentByAddress(address) === null) {

            if (typeof this.geoLocationContinentsLists[location.continent] === 'undefined') this.geoLocationContinentsLists[location.continent] = []
            this.geoLocationContinentsLists[location.continent].push(address);
            this.countGeoLocationContinentsLists += 1;
        }

        return location.continent;
    }

    searchGeoLocationContinentByAddress(address){

        for (let continent in this.geoLocationContinentsLists)
            for (let i=0; i<this.geoLocationContinentsLists[continent].length; i++) {
                let addressInContinent = this.geoLocationContinentsLists[continent][i];
                if (addressInContinent === address)
                    return continent;
            }

        return null;
    }

    async getLocationFromAddress(address){

        if (typeof this.geoLocationLists[address] !== 'undefined')
            return this.geoLocationLists[address];

        try{
            let data = await this.downloadFile("http://ip-api.com/json/"+address);
            if (data !== null){

                let countryCode = '';
                let country = '';
                let continent = '--';

                //console.log("location data", data);

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

exports.GeoLocationLists =  new GeoLocationLists();