import GeoHelper from '../node/lists/geolocation-lists/geo-helpers/geo-helper.js';
import InterfaceBlockchainAddressHelper from '../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper.js';
import WebDollarCoins from "../common/utils/coins/WebDollar-Coins.js";
import consts from '../consts/const_global.js';
import NODE_TYPE from '../node/lists/types/Node-Type.js';
import CONNECTIONS_TYPE from '../node/lists/types/Connection-Type.js';
import VersionCheckerHelper from "../common/utils/helpers/Version-Checker-Helper.js";
import BufferExtended from "../common/utils/BufferExtended.js";
import NodesWaitlist from '../node/lists/waitlist/Nodes-Waitlist.js';
import NodesList from '../node/lists/Nodes-List.js';
import PoolsUtils from "../common/mining-pools/common/Pools-Utils.js";
import WebDollarCrypto from "../common/crypto/WebDollar-Crypto.js";
import AdvancedMessages from "../node/menu/Advanced-Messages.js";

class Applications {

    constructor() {

        this.GeoHelper = GeoHelper;
        this.AddressHelper = InterfaceBlockchainAddressHelper;
        this.CoinsHelper = WebDollarCoins;
        this.VersionCheckerHelper = VersionCheckerHelper;
        this.PoolsUtilsHelper = PoolsUtils;

        this.BufferExtended = BufferExtended;

        this.NodesList = NodesList;
        this.NodesWaitlist = NodesWaitlist;

        this.WebDollarCrypto = WebDollarCrypto;

        this.CONSTS = consts;

        this.NODE_TYPE = NODE_TYPE;
        this.CONNECTIONS_TYPE = CONNECTIONS_TYPE;

        this.AdvancedMessages = AdvancedMessages;
    }

}

export default new Applications();