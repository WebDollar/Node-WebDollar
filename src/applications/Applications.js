import NetworkGoogleMaps from 'applications/maps/google-maps/Network-Google-Maps';
import NetworkNativeMaps from 'applications/maps/native/Network-Native-Maps';

class Applications{

    constructor(){
        this.NetworkGoogleMaps = NetworkGoogleMaps;
        this.NetworkNativeMaps = NetworkNativeMaps;
    }

}

export default new Applications()