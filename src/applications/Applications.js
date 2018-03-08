import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

class Applications{

    constructor() {
        this.GeoHelper = GeoHelper;
        this.AddressHelper = InterfaceBlockchainAddressHelper;
    }

}

export default new Applications()