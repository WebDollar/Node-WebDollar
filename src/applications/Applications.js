import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper';
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import consts from 'consts/const_global';
import NODE_TYPE from 'node/lists/types/Node-Type';
import CONNECTIONS_TYPE from 'node/lists/types/Connection-Type';
import VersionCheckerHelper from "common/utils/helpers/Version-Checker-Helper";
import BufferExtended from "common/utils/BufferExtended";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';

class Applications {

    constructor() {

        this.GeoHelper = GeoHelper;
        this.AddressHelper = InterfaceBlockchainAddressHelper;
        this.CoinsHelper = WebDollarCoins;
        this.VersionCheckerHelper = VersionCheckerHelper;
        this.BufferExtended = BufferExtended;

        this.NodesList = NodesList;
        this.NodesWaitlist = NodesWaitlist;


        this.CONSTS = consts;

        this.NODE_TYPE = NODE_TYPE;
        this.CONNECTIONS_TYPE = CONNECTIONS_TYPE;
    }

}

export default new Applications();