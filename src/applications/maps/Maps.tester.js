class MapsTester{

    constructor(parent){

        this.parent = parent;
    }

    testConnections(){

        this._createFakeMarker({country: 'USA', lat: 37.980388, lng:-92.539714 }, 2000);
        this._createFakeMarker({country: 'USA', lat: 36.828015, lng:-119.458796 }, 3100);
        this._createFakeMarker({country: 'Brazil', lat: -10.252334, lng:-55.143146}, 4200);
        this._createFakeMarker({country: 'Germany', lat: 51.809770, lng:8.688927}, 2000);
        this._createFakeMarker({country: 'France', lat: 44.745281, lng:2.080051}, 1500);
        this._createFakeMarker({country: 'Russia', lat: 56.875767, lng:41.410924}, 3500);
        this._createFakeMarker({country: 'India', lat: 17.001243, lng:78.807492}, 2500);
        this._createFakeMarker({country: 'UK', lat: 53.376271, lng:-0.660215}, 1500);
        this._createFakeMarker({country: 'China', lat: 29.832851, lng: 120.072671}, 5000);
        this._createFakeMarker({country: 'South Africa', lat: -29.256599, lng: 24.324561}, 5000);
        this._createFakeMarker({country: 'Portugal', lat: 38.989770, lng: -7.430283}, 5100);
        this._createFakeMarker({country: 'Australia', lat: -34.041968, lng: 150.994123}, 5200);
        this._createFakeMarker({country: 'Saint Petersburg', lat: 59.884495, lng: 30.434003}, 5100);
        this._createFakeMarker({country: 'Saudi', lat: 24.759399, lng: 46.640036}, 4800);
        this._createFakeMarker({country: 'Mexico', lat: 19.409722, lng: -98.991313}, 2200);
        this._createFakeMarker({country: 'USA', lat: 31.124374, lng: -97.531948}, 2200);
        this._createFakeMarker({country: 'South Korea', lat: 37.542154, lng: 126.988170}, 3400);
        this._createFakeMarker({country: 'Buenos Aires', lat: -34.534501, lng:-58.438049}, 3400);


    }

    _createFakeMarker( coordinates, timeOut){

        setTimeout( ()=>{

            console.log("coordinates", coordinates);
            this.parent._addMarker(coordinates, "fake");

        }, timeOut)

    }


}

export default MapsTester;