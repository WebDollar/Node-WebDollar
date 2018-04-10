import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import consts from 'consts/const_global'
import NodesType from 'node/lists/types/Nodes-Type'
import ConnectionsType from 'node/lists/types/Connections-Type'

class Applications{

    constructor() {

        this.GeoHelper = GeoHelper;
        this.AddressHelper = InterfaceBlockchainAddressHelper;
        this.CoinsHelper = WebDollarCoins;
        this.CONSTS = consts;

        this.NodesType = NodesType;
        this.ConnectionsType = ConnectionsType;
    }

}

export default new Applications()