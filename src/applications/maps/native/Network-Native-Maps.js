import NodesList from 'node/lists/nodes-list'
import CircleMap from "./helpers/Circle-Map";
import MapModal from "./helpers/Map-Modal";
import CellCounter from "./helpers/Cell-Counter";
import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'


class NetworkNativeMaps {

    constructor(map) {

        this._markers = [];
        this._markerMyself = null;

    }

    createMap(mapSelector){

        mapSelector = mapSelector || '#map svg';

        this._mapElem = document.querySelector(mapSelector);
        this._circleMap = new CircleMap(this._mapElem);

        this._mapModal = new MapModal();
        this._mapElem.onmousemove = e => this._mapHighlight(e);

        this._cellCounter = new CellCounter();
    }

    async initialize(){

        NodesList.registerEvent("connected", {type: ["all"]}, async (err, nodesListObject) => {

            let geoLocation = await nodesListObject.socket.node.sckAddress.getGeoLocation();

            //console.log("geoLocation",geoLocation);

            this._addMarker(geoLocation, nodesListObject.socket);

        } );

        NodesList.registerEvent("disconnected", {type: ["all"]}, async (err, nodesListObject) => {

            //deleting the marker

            let markerIndex = this._findMarkerIndexBySocket(nodesListObject.socket);

            if (markerIndex !== -1) {


                this._markers.splice(markerIndex, 1);
            }

        });

        await this._showMyself();

    }

    async _showMyself(){
        let geoLocation = await GeoHelper.getLocationFromAddress('', true);

        this._addMarker( geoLocation, 'myself');
    }

    _addMarker(geoLocation, socket){

        let position = {lat: geoLocation.lat||0, lng: geoLocation.lng||0};

        let marker = {
            socket: socket,
            pos: position,
            desc: this._getInfoWindowContent(geoLocation, socket),
        };


        this._markers.push(marker);

        if (socket === "myself") this.highlightMe(marker); else
        if (socket === "fake") this.highlightConnectedPeer(marker); else
        this.highlightConnectedPeer(marker)

    }

    highlightMe(marker){

        this._markerMyself = marker;

        let cell = this._circleMap.getCellByLocation(marker.pos.lat, marker.pos.lng);
        if (cell) {
            marker.cell = cell;

            this._circleMap.highlightCell(cell, 'own-peer', marker.desc);

            this._cellCounter.incCellCount(cell);

            //add links to current nodes
            for (let i = 0; i< this._markers.length; i++)
                if (this._markers[i] !== marker)
                    this._circleMap.addLink(cell, this._markers[i].cell);

        }
    }

    highlightConnectedPeer(marker){

        let cell = this._circleMap.getCellByLocation(marker.pos.lat, marker.pos.lng);
        if (cell) {

            marker.cell = cell;

            this._circleMap.highlightCell(cell, 'connect-peer', marker.desc);

            this._cellCounter.incCellCount(cell);

            //add links to the myselfMarker
            if (this._markerMyself !== null && this._markerMyself !== undefined && this._markerMyself !== marker)
                this._circleMap.addLink(cell, this._markerMyself);

        }
    }


    _getInfoWindowContent(geoLocation, socket){

        let address = '';

        if (socket === 'myself') address = 'YOU';
        else  if (socket === 'fake') address = geoLocation.country;
        else address = socket.node.sckAddress.toString();


        let nodeType = '';

        if (socket === 'myself') nodeType = 'myself';  else
        if (socket === 'fake') nodeType = 'webPeer';  else
        if (socket !== null)
            switch (socket.node.type){
                case 'client': nodeType = 'serverSocket'; break;
                case 'server' : nodeType = 'clientSocket'; break;
                case 'webpeer' : nodeType = 'webPeer'; break;
            }

        let status = "node";

        if (socket === "myself" || socket === "fake") status = "YOU";
        else
        if (socket.node.sckAddress !== null && socket.node.sckAddress )

        return {
            status: status,
            city: geoLocation.city||'',
            country: geoLocation.country||'',
            address: address,
            protocol: (socket === 'myself' || socket === "fake" ) ? '' : socket.node.type + ' : '+socket.node.index,
            isp: geoLocation.isp||'',
            geo: geoLocation,
            nodeType: nodeType,
        }

    }

    _mapHighlight(e) {

        if (e.target.data) {
            const data = e.target.data;
            this._mapModal.show(data);
        } else
            this._mapModal.hide();

    }

    createTestConnections(){

        let cell1 = this._circleMap.getCellByLocation(66.160507,  -153.369141);
        let cell2 = this._circleMap.getCellByLocation(73.500823,  -21.755973);
        let cell3 = this._circleMap.getCellByLocation(-28.083,  23.044);
        let cell4 = this._circleMap.getCellByLocation(-20.72,  127.10);

        let data = {
            status: status,
            city: "Bucharest",
            country: "RO",
            protocol: "peer",
            addr: "76.44.22.11"
        };

        this._circleMap.addLink(cell1, cell2);
        this._circleMap.addLink(cell2, cell3);
        this._circleMap.addLink(cell3, cell4);

        this._circleMap.highlightCell(cell1, 'known-peer', data);
        this._circleMap.highlightCell(cell2, 'own-peer', data);
        this._circleMap.highlightCell(cell3, 'own-peer', data);
        this._circleMap.highlightCell(cell4, 'own-peer', data);

    }

}


export default new NetworkNativeMaps()