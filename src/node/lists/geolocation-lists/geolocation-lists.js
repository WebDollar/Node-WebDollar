const axios = require('axios');
const ipaddr = require('ipaddr.js');
import {GeoLocationAddressObject} from './geolocation-address-object.js';
import {SocketAddress} from './../../../common/sockets/socket-address';
import {GeoHelper} from './geo-helpers/geo-helper';

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

    async includeAddress(sckAddress, port){

        sckAddress = SocketAddress.createSocketAddress(sckAddress, port);

        let location = await GeoHelper.getLocationFromAddress(sckAddress);

        if (location === null){
            console.log("LOCATION was not been able to get");
            return null;
        }

        location.continent = location.continent || '--';

        this._addGeoLocationContinentByAddress(sckAddress, location);

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

    _addGeoLocationContinentByAddress(sckAddress, location){

        sckAddress = SocketAddress.createSocketAddress(sckAddress);


        if (this._searchGeoLocationContinentByAddress(sckAddress) === null) {

            if (typeof this.geoLocationContinentsLists[location.continent] === 'undefined') this.geoLocationContinentsLists[location.continent] = [];

            let geoLocationAddressObject = new GeoLocationAddressObject(sckAddress, undefined, location);
            geoLocationAddressObject.refreshLastTimeChecked();

            this.geoLocationContinentsLists[location.continent].push(geoLocationAddressObject);
            this.countGeoLocationContinentsLists += 1;
        }

        this.printGeoLocationContinentsLists();

        return location.continent;
    }

    _searchGeoLocationContinentByAddress(sckAddress){

        for (let continent in this.geoLocationContinentsLists)
            if (this.geoLocationContinentsLists.hasOwnProperty(continent))
                for (let i=0; i<this.geoLocationContinentsLists[continent].length; i++) {

                if (this.geoLocationContinentsLists[continent][i].sckAddress.matchAddress(sckAddress))
                    return continent;
                }

        return null;
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