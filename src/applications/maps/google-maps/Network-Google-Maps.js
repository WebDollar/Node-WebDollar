import MapsTester from "./../Maps.tester"
import NodesList from 'node/lists/nodes-list'
import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'
import NetworkMapStyleLight from './styles/network-map-style-light';

class NetworkGoogleMaps {

    /*
        markers = []
     */

    constructor(){

        console.log("NetworkMap constructor");

        this._markers = [];

        let iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
        this.icons = {

            general: {
                icon: 'http://maps.google.com/mapfiles/ms/micons/red.png',
            },
            myself: {
                icon: 'http://pic2.iranshao.com/emoji/qq/4.gif',
            },
            fullNodeServer: {
                icon: 'http://icons.iconarchive.com/icons/blackvariant/button-ui-system-apps/16/Terminal-icon.png',
            },
            webPeer: {
                icon: 'http://icons.iconarchive.com/icons/dtafalonso/android-lollipop/16/Browser-icon.png',
            },
            clientSocket: {
                icon: 'http://icons.iconarchive.com/icons/simplefly/simple-green/16/plug-electricity-icon.png',
            }
        };

    }

    createMap(id, style){

        if ( style === undefined)
            style  = NetworkMapStyleLight.style;

        let map = new google.maps.Map(document.getElementById(id), {
            zoom: 2,
            center:  {lat: 37.390487, lng: 29.308516},
            mapTypeId: 'roadmap',
            styles: style,
        });

        window.map = map;

        this._map = map

        return map;
    }

    createTestConnections(){

        let mapsTester = new MapsTester(this);
        mapsTester.testConnections();

    }


    async initialize(){

        if ( google === undefined ||  google.maps === undefined){
            alert('GOOGLE MAPS LIBRARY IS NOT REGISTERED');
            return false;
        }

        NodesList.registerEvent("connected", {type: ["all"]}, async (err, nodesListObject) => {

            let geoLocation = await nodesListObject.socket.node.sckAddress.getGeoLocation();

            //console.log("geoLocation",geoLocation);

            this._addMarker(geoLocation, nodesListObject.socket);

        } );

        NodesList.registerEvent("disconnected", {type: ["all"]}, async (err, nodesListObject) => {

            //deleting the marker

            let markerIndex = this._findMarkerIndexBySocket(nodesListObject.socket);

            if (markerIndex !== -1) {

                this._markers[markerIndex].setMap(null);

                if ( this._markers[markerIndex].curveMarker !== undefined)  this._markers[markerIndex].curveMarker.setMap(null);
                if ( this._markers[markerIndex].linePoly !== undefined)  this._markers[markerIndex].linePoly.setMap(null);
                if ( this._markers[markerIndex].infoWindow !== undefined) this._markers[markerIndex].infoWindow.setMap(null);

                this._markers.splice(markerIndex, 1);
            }

        });

        await this._showMyself();
    }

    _getInfoWindowContent(geoLocation, socket){

        let address = '';
        if (socket === 'myself') address = 'YOU';
        else  if (socket === 'fake') address = geoLocation.country;
        else address = socket.node.sckAddress.toString();

        return (
            '<div id="content">'+
                '<div id="siteNotice">'+
                '</div>'+
                    '<h1 class="firstHeading" style="padding-bottom: 0">'+ address +'</h1>'+
                    '<h2 class="secondHeading">'+( (socket === 'myself' || socket === "fake" ) ? '' : socket.node.type + ' : '+socket.node.index)+'</h2>'+
                    '<div id="bodyContent">'+
                        '<p>Connected to <b>'+ (geoLocation.city||'')+', '+geoLocation.country||''+'</b> <br/>'+
                            geoLocation.isp||'' + '<br/> <br/>'+
                            (geoLocation.lat||'0') + '    '+ (geoLocation.lng||'0')+ '<br/>'+
                        '</p>'+
                '</div>'+
            '</div>');
    }

    _findMarkerIndexBySocket(socket){

        for (let i=0; i< this._markers.length; i++ )
            if (this._markers[i].socket === socket)
                return i;

        return -1;

    }

    _addMarker(geoLocation, socket){

        if ( google === undefined ||  google.maps === undefined){
            alert('GOOGLE MAPS LIBRARY IS NOT REGISTERED');
            return false;
        }

        //console.log("marker ", google.maps.Marker, map)

        let position = {lat: geoLocation.lat||0, lng: geoLocation.lng||0};

        let feature = '';

        if (socket === 'myself') feature = 'myself';
        else
        if (socket === 'fake') feature = 'webPeer';
        else
        if (socket !== null)
            switch (socket.node.type){
                case 'client': feature = 'fullNodeServer'; break;
                case 'server' : feature = 'clientSocket'; break;
                case 'webpeer' : feature = 'webPeer'; break;
            }

        let marker = new google.maps.Marker({
            position: position,
            map: this._map,
            clickable: true,
            icon: (this.icons.hasOwnProperty(feature) ? this.icons[feature].icon : this.icons['general']),
        });

        let infoWindow = new google.maps.InfoWindow({
            content: this._getInfoWindowContent(geoLocation, socket)
        });

        marker.addListener('click', function() {
            infoWindow.open(this._map, marker);
        });

        marker.socket = socket;
        marker.infoWindow = infoWindow;

        this._markers.push(marker);

        this._createConnectionsArcs(false);

    }

    async _showMyself(){
        let geoLocation = await GeoHelper.getLocationFromAddress('', true);

        this._addMarker( geoLocation, 'myself');
    }


    initializePolylines(){


        this._createConnectionsArcs(false);
        google.maps.event.addListener(this._map, 'projection_changed', () => {this._createConnectionsArcs(true) });
        google.maps.event.addListener(this._map, 'zoom_changed', () => {this._createConnectionsArcs(true)});

        // google.maps.event.addListener(markerP1, 'position_changed', updateCurveMarker);
    }

    _createConnectionsArcs(update, showOldArcs) {

        if ( showOldArcs === undefined) showOldArcs = false;

        /*
            TUTORIAL - BASED ON http://jsfiddle.net/medmunds/sd10up9t/
         */

        let markerMyself = null;
        for (let i=0; i<this._markers.length; i++)
            if (this._markers[i].socket === "myself"){
                markerMyself = this._markers[i];
                break;
            }

        if (markerMyself === null) {
            console.log("NetworkMap: No Marker Myself");
            return false;
        }


        let  projection = this._map.getProjection();

        if (!projection) {
            console.log("NetworkMap - PROJECT is not defined");
            return false;
        }

        let pos1 = markerMyself.getPosition(); // latlng
        let p1 = projection.fromLatLngToPoint(pos1); // xy

        let Point = google.maps.Point;

        const curvature = 0.2; // how curvy to make the arc

        for (let i=0; i<this._markers.length; i++)
            if (this._markers[i] !== markerMyself){
                let marker = this._markers[i];

                let pos2 = marker.getPosition();
                let lineColor = 'black';

                if (marker.socket === "fake") lineColor = "navy";
                else
                switch (marker.socket.node.type){
                    case 'client': lineColor = 'red'; break;
                    case 'server' : lineColor = 'red'; break;
                    case 'webpeer' : lineColor = 'blue'; break;
                }

                if (showOldArcs){

                    let p2 = projection.fromLatLngToPoint(pos2);

                    // Calculate the arc.
                    // To simplify the math, these points
                    // are all relative to p1:
                    let e = new Point(p2.x - p1.x, p2.y - p1.y), // endpoint (p2 relative to p1)
                        m = new Point(e.x / 2, e.y / 2), // midpoint
                        o = new Point(e.y, -e.x), // orthogonal
                        c = new Point( // curve control point
                            m.x + curvature * o.x,
                            m.y + curvature * o.y);

                    let pathDef = 'M 0,0 ' +
                        'q ' + c.x + ',' + c.y + ' ' + e.x + ',' + e.y;

                    let zoom = this._map.getZoom(),
                        scale = Math.max( 1 / (Math.pow(2, -zoom)), 0.1);

                    let symbol = {
                        path: pathDef,
                        scale: scale,
                        strokeWeight: 2,
                        fillColor: 'none'
                    };

                    if (!marker.curveMarker)
                        marker.curveMarker = new google.maps.Marker({
                            position: pos1,
                            clickable: false,
                            icon: symbol,
                            zIndex: 0, // behind the other markers
                            map: this._map
                        });
                    else

                        marker.curveMarker.setOptions({
                            position: pos1,
                            icon: symbol,
                        });

                    //line polyline
                } else if (update === false) {

                    let polyPath = [
                        {lat: pos1.lat(), lng: pos1.lng()},
                        {lat: pos2.lat(), lng: pos2.lng()},
                    ];

                    if (!marker.linePoly) { //creating for the first time a linePoly

                        marker.linePoly = new google.maps.Polyline({
                            path: polyPath,
                            geodesic: true,
                            strokeColor: lineColor,
                            strokeOpacity: 1.0,
                            strokeWeight: 2
                        });

                        marker.linePoly.setMap(this._map);

                    } else

                        marker.linePoly.setOptions({
                            position: polyPath,
                        });

                }


            }

    }


}

export default new NetworkGoogleMaps();