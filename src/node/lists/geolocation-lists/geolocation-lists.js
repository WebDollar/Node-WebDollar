const axios = require('axios');
const ipaddr = require('ipaddr.js');
import {getContinentFromCountry} from './data/continents.js';
import {GeoLocationAddressObject} from './geolocation-address-object.js';
import {SocketAddress} from './../../../common/sockets/socket-address';

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

    async includeAddress(address, port){

        let sckAddress = SocketAddress.createSocketAddress(address, port);

        let location = await this.getLocationFromAddress(sckAddress);

        if (location === null){
            console.log("LOCATION was not been able to get");
            return null;
        }

        location.continent = location.continent || '--';

        this.addGeoLocationContinentByAddress(sckAddress, location);

        return location;
    }

    async includeSocket(socket){

        if (typeof socket === 'undefined' || socket === null) return null;

        //in case the location has been set before  (avoiding double insertion)
        if (typeof socket.node !== 'undefined' && typeof socket.node.location !== 'undefined' && socket.node.location !== null) return socket.node.location;

        let location = await this.includeAddress(socket.node.sckAddress);
        socket.node.location = location;
        return location;
    }

    addGeoLocationContinentByAddress(sckAddress, location){

        if (this.searchGeoLocationContinentByAddress(address) === null) {

            if (typeof this.geoLocationContinentsLists[location.continent] === 'undefined') this.geoLocationContinentsLists[location.continent] = [];

            let geoLocationAddressObject = new GeoLocationAddressObject(sckAddress, undefined, location);
            geoLocationAddressObject.refreshLastTimeChecked();

            this.geoLocationContinentsLists[location.continent].push(geoLocationAddressObject);
            this.countGeoLocationContinentsLists += 1;
        }

        this.printGeoLocationContinentsLists();

        return location.continent;
    }

    searchGeoLocationContinentByAddress(address){

        for (let continent in this.geoLocationContinentsLists)
            if (this.geoLocationContinentsLists.hasOwnProperty(continent))
                for (let i=0; i<this.geoLocationContinentsLists[continent].length; i++) {

                if (this.geoLocationContinentsLists[continent][i].matchAddress(address))
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

                if (data.hasOwnProperty('country')){
                    country = data.country;
                }

                if (data.hasOwnProperty('countryCode')){
                    countryCode = data.countryCode;

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


    printGeoLocationContinentsLists(){

        for (let continent in this.geoLocationContinentsLists)
            if (this.geoLocationContinentsLists.hasOwnProperty(continent)) {

                let listString = '';
                for (let i = 0; i < this.geoLocationContinentsLists[continent].length; i++) {
                    listString += this.geoLocationContinentsLists[continent][i].toString()+ "   ,   ";
                }

                console.log("continent", continent, " : ",listString);
            }
    }

}

exports.GeoLocationLists =  new GeoLocationLists();