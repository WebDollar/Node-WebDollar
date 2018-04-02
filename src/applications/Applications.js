import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class Applications{

    constructor() {
        this.GeoHelper = GeoHelper;
        this.AddressHelper = InterfaceBlockchainAddressHelper;
        this.CoinsHelper = WebDollarCoins;
    }

}

export default new Applications()