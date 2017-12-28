import RobinsonProjection from "./helpers/RobinsonProjection"
import CircleMap from "./helpers/Circle-Map";
import MapModal from "./helpers/Map-Modal";
import CellCounter from "./helpers/Cell-Counter";


class NetworkNativeMaps {

    constructor(map) {

    }

    createMap(mapSelector){

        mapSelector = mapSelector || '#map svg';

        this._mapElem = document.querySelector(mapSelector);
        this._circleMap = new CircleMap(this._mapElem);

        this._mapModal = new MapModal();
        this._mapElem.onmousemove = e => this._mapHighlight(e);
    }

    initialize(){

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

        console.log(cell3, cell4);

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