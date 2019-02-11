import GeoLocationAddressObject from './GeoLocation-Address-Object.js';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'

class GeoLocationLists {

    /*
        geoLocationContinentsLists = {}
        countGeoLocationContinentsLists = 0
     */

    constructor(){

        console.log("GeoLocations constructor");

        this.geoLocationContinentsLists = {};
        this.countGeoLocationContinentsLists = 0;

        this._addressesResolved = {};

        this._pendingLocationLists = [];

        setTimeout( this._processGeoLocationPendingList.bind(this), process.env.BROWSER ? 500 : 5000 );
    }

    async _processGeoLocationPendingList(){

        if (this._pendingLocationLists.length > 0) {

            let data = this._pendingLocationLists[0];
            this._pendingLocationLists.splice(0,1);

            let location = await GeoHelper.getLocationFromAddress( data.address );

            if ( !location ) {
                //console.warn("LOCATION was not been able to get");
                return null;
            }

            location.continent = location.continent || '--';

            this._addGeoLocationContinentByAddress( data.address, location );

            try {

                data.resolver(location);

            } catch (exception){



            }

        }

        setTimeout(this._processGeoLocationPendingList.bind(this), process.env.BROWSER ? 500 : 5000);

    }

    includeAddress(sckAddress, port){

        sckAddress = SocketAddress.createSocketAddress(sckAddress, port);

        let address = sckAddress.getAddress(false, false);

        if ( this._addressesResolved[address] )
            return this._addressesResolved[address];

        let data = {
            address: sckAddress,
            promise: sckAddress._geoLocation,
            resolver: sckAddress._geoLocationResolver,
        };

        this._pendingLocationLists.push(data);
        this._addressesResolved[ address ] = data;

        return data;
    }

    includeSocket(socket){

        if ( !socket ) return null;

        if ( !socket.node &&  !socket.node.location ) {
            let data = this.includeAddress(socket.node.sckAddress);
            socket.node.sckAddress._geoLocation = data.promise;
            socket.node.sckAddress._geoLocationResolver = data.resolver;
        }

        socket.node.location = socket.node.sckAddress.geoLocation;

        return socket.node.location;
    }

    _addGeoLocationContinentByAddress(sckAddress, location){

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        if ( !this.geoLocationContinentsLists[ location.continent ] ) this.geoLocationContinentsLists[ location.continent ] = [];

        let geoLocationAddressObject = new GeoLocationAddressObject(sckAddress, undefined, location);
        geoLocationAddressObject.refreshLastTimeChecked();

        this.geoLocationContinentsLists[location.continent].push(geoLocationAddressObject);
        this.countGeoLocationContinentsLists += 1;

        //this.printGeoLocationContinentsLists();

        return location.continent;
    }

    printGeoLocationContinentsLists(){

        for (let continent in this.geoLocationContinentsLists){
            let listString = '';

            for (let i = 0; i < this.geoLocationContinentsLists[continent].length; i++)
                listString += this.geoLocationContinentsLists[continent][i].toString()+ "   ,   ";

        }
    }

}

export default new GeoLocationLists();