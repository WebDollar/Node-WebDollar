import {NodesList} from './../../node/lists/nodes-list';
import {GeoHelper} from './../../node/lists/geolocation-lists/geo-helpers/geo-helper';

class NetworkMap {

    /*
        markers = []
     */

    constructor(){

        console.log("NetworkMap constructor");

        this.markers = [];

        let iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
        this.icons = {

            general: {
                icon: 'http://maps.google.com/mapfiles/ms/micons/red.png',
            },
            myself: {
                icon: 'http://maps.gstatic.com/mapfiles/cb/man_arrow-0.png',
            },
            fullNodeServer: {
                icon: 'http://icons.iconarchive.com/icons/blackvariant/button-ui-system-apps/32/Terminal-icon.png',
            },
            webPeer: {
                icon: 'https://addons.cdn.mozilla.net/user-media/addon_icons/674/674247-32.png?modified=1499170820',
            },
            clientSocket: {
                icon: 'http://icons.iconarchive.com/icons/simplefly/simple-green/32/plug-electricity-icon.png',
            }
        };

    }

    createMap(id){

        let map = new google.maps.Map(document.getElementById(id), {
            zoom: 2,
            center:  {lat: 0, lng: 0},
            mapTypeId: 'roadmap'
        });

        window.map = map;

        return map;
    }

    initialize(map){

        if (typeof google === 'undefined' || typeof google.maps === 'undefined'){
            alert('GOOGLE MAPS LIBRARY IS NOT REGISTERED');
            return false;
        }

        NodesList.registerEvent("connected", {type: ["all"]}, async (err, nodeListObject) => {

            let geoLocation = await nodeListObject.socket.node.sckAddress.getGeoLocation();

            console.log("geoLocation",geoLocation);

            this._addMarker( geoLocation, nodeListObject.socket);

        } );

        NodesList.registerEvent("disconnected", {type: ["all"]}, async (err, nodeListObject) => {

            //deleting the marker

            let markerIndex = this._findMarkerIndexBySocket(nodeListObject.socket);

            if (markerIndex !== -1)
                this.markers.splice(markerIndex,1);

        });

        this._showMyself();
    }

    _getInfoWindowContent(geoLocation, socket){

        return (
            '<div id="content">'+
                '<div id="siteNotice">'+
                '</div>'+
                    '<h1 class="firstHeading" style="padding-bottom: 0">'+(socket === 'myself' ? 'YOU' : socket.node.sckAddress.getAddress(false) )+'</h1>'+
                    '<h2 class="secondHeading">'+(socket === 'myself' ? '' : socket.node.type + ' : '+socket.node.index)+'</h2>'+
                    '<div id="bodyContent">'+
                        '<p>Connected to <b>'+geoLocation.city||''+', '+geoLocation.country||''+'</b> <br/>'+
                            geoLocation.isp + '<br/> <br/>'+
                            (geoLocation.lat||'undefined') + '    '+ (geoLocation.lng||'undefined')+ '<br/>'+
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

    _addMarker(geoLocation, socket){

        if (typeof google === 'undefined' || typeof google.maps === 'undefined'){
            alert('GOOGLE MAPS LIBRARY IS NOT REGISTERED');
            return false;
        }

        let position = {lat: geoLocation.lat||0, lng: geoLocation.lng||0};

        let feature = '';

        if (socket === 'myself') feature = 'myself';
        else
        if (socket !== null)
            switch (socket.node.type){
                case 'client': feature = 'fullNodeServer'; break;
                case 'server' : feature = 'clientSocket'; break;
                case 'webpeer' : feature = 'webPeer'; break;
            }

        let marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: (this.icons.hasOwnProperty(feature) ? this.icons[feature].icon : this.icons['general']),
        });

        let infoWindow = new google.maps.InfoWindow({
            content: this._getInfoWindowContent(geoLocation, socket)
        });

        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        });

        marker.socket = socket;
        marker.infoWindow = infoWindow;

        this.markers.push(marker);

    }

    async _showMyself(){
        let geoLocation = await GeoHelper.getLocationFromAddress('', true);

        this._addMarker( geoLocation, 'myself');
    }

}

exports.NetworkMap =  new NetworkMap();