import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper';
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import consts from 'consts/const_global';
import NODES_TYPE from 'node/lists/types/Nodes-Type';
import CONNECTIONS_TYPE from 'node/lists/types/Connections-Type';
import VersionCheckerHelper from "common/utils/helpers/Version-Checker-Helper";
import BufferExtended from "common/utils/BufferExtended";
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";

class Applications {

    constructor() {

        this.GeoHelper = GeoHelper;
        this.AddressHelper = InterfaceBlockchainAddressHelper;
        this.CoinsHelper = WebDollarCoins;
        this.VersionCheckerHelper = VersionCheckerHelper;
        this.BufferExtended = BufferExtended;
        this.WebDollarCrypto = WebDollarCrypto;

        this.CONSTS = consts;

        this.NODES_TYPE = NODES_TYPE;
        this.CONNECTIONS_TYPE = CONNECTIONS_TYPE;
    }

}

export default new Applications();