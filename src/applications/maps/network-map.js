import {NodesList} from './../../node/lists/nodes-list';

class NetworkMap {

    /*
        markers = []
     */

    constructor(){

        console.log("NetworkMap constructor");

        this.markers = [];

    }

    initialize(map){

        if (typeof google === 'undefined' || typeof google.maps === 'undefined'){
            alert('GOOGLE MAPS LIBRARY IS NOT REGISTERED');
            return false;
        }

        NodesList.registerEvent("connected", {type: ["all"]}, async (err, nodeListObject) => {

            let geoLocation = await nodeListObject.socket.node.sckAddress.getGeoLocation();

            console.log("geoLocation",geoLocation);

            let position = {lat: geoLocation.lat, lng: geoLocation.lng};

            let marker = new google.maps.Marker({
                position: position,
                map: map,
            });

            let infoWindow = new google.maps.InfoWindow({
                content: this._getInfoWindowContent(geoLocation, nodeListObject.socket),
            });

            marker.socket = nodeListObject.socket;
            marker.infoWindow = infoWindow;

            this.markers.push(marker);

        } );

        NodesList.registerEvent("disconnected", {type: ["all"]}, async (err, nodeListObject) => {

            //deleting the marker

            let markerIndex = this._findMarkerIndexBySocket(nodeListObject.socket);

            if (markerIndex !== -1)
                this.markers.splice(markerIndex,1);


        });
    }

    _getInfoWindowContent(geoLocation, socket){
        return (
            '<div id="content">'+
                '<div id="siteNotice">'+
                '</div>'+
                    '<h1 id="firstHeading" class="firstHeading">'+socket.node.type+' '+socket.node.sckAddress.getAddress(false)+'</h1>'+
                    '<div id="bodyContent">'+
                        '<p>Connected to <b>'+geoLocation.city+', '+geoLocation.country+'</b> <br/>'+
                            geoLocation.org+
                        '</p>'+
                '</div>'+
            '</div>');
    }

    _findMarkerIndexBySocket(socket){

        for (let i=0; i< this.markers.length; i++ )
            if (this.markers[i].socket === socket)
                return i;

        return -1;

    }

}

exports.NetworkMap =  new NetworkMap();