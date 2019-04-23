import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List'
import GeoLocationLists from 'node/lists/geolocation-lists/GeoLocation-Lists'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import Blockchain from "main-blockchain/Blockchain"
import NODE_TYPE from "../types/Node-Type";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import BansList from "common/utils/bans/BansList";
import AddressBanList from "common/utils/bans/AddressBanList";
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import Utils from "common/utils/helpers/Utils";

class NodesStats {

    constructor(){

        this._timeStart = new Date().getTime();

        this.statsClients = 0;
        this.statsServer = 0;
        this.statsWebPeers = 0;

        this.statsBrowsers = 0;
        this.statsTerminal = 0;

        this.statsWaitlistFullNodes = 0;
        this.statsWaitlistLightNodes = 0;

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => { this._recalculateStats(nodesListObject, false ) } );
        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });

        NodesWaitlist.emitter.on("waitlist/new-node", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });
        NodesWaitlist.emitter.on("waitlist/delete-node", (nodesListObject ) => { this._recalculateStats(nodesListObject, false ) });

        setInterval( this._printStats.bind(this), consts.SETTINGS.PARAMS.STATUS_INTERVAL)
    }

    _printStats(){

        console.info(" blocks: ", Blockchain.blockchain.blocks.length, BlockchainGenesis.isPoSActivated(Blockchain.blockchain.blocks.length) ? "POS" : "POW" );
        console.info(" amount mining wallet: ", Blockchain.AccountantTree.getBalance( Blockchain.blockchain.mining.minerAddress  ) / WebDollarCoins.WEBD, "  amount");

        if (Blockchain.blockchain.mining.timeMinedBlock) {
            let time = Utils.timePassed(Blockchain.blockchain.mining.timeMinedBlock);
            console.info(`time since block mined ${Math.floor(time.d)} d ${Math.floor(time.h)} h ${Math.floor(time.m)} m`);
        }

        try {
            if (Blockchain.blockchain.mining.minerAddress && Buffer.isBuffer(Blockchain.blockchain.mining.unencodedMinerAddress))
                console.info("Exists: ", Blockchain.Wallet.getAddress({unencodedAddress: Blockchain.blockchain.mining.unencodedMinerAddress}) !== null ? "YES" : "NO");
        } catch (err){
            console.error(" Wallet was not found ", Blockchain.blockchain.mining.unencodedMinerAddress);
        }

        console.info(" v: ", consts.SETTINGS.NODE.VERSION);

        let time = Utils.timePassed(this._timeStart);
        console.info( `up time ${Math.floor(time.d) } d ${Math.floor(time.h) } h ${ Math.floor(time.m) } m` );

        console.log(" connected to: ", this.statsClients," , from: ", this.statsServer , " web peers WEBRTC", this.statsWebPeers," Network FullNodes:",this.statsWaitlistFullNodes, " Network LightNodes:",this.statsWaitlistLightNodes, "    GeoLocationContinents: ", GeoLocationLists.countGeoLocationContinentsLists );
        console.log(" browsers: ", this.statsBrowsers, " terminal: ", this.statsTerminal);

        let string1 = "";
        let clients = NodesList.getNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET);
        for (let i=0; i<Math.min( clients.length, 50); i++)
            string1 += '('+clients[i].socket.node.sckAddress.toString() + ')   ';
        if (clients.length > 50) string1 += ".........";

        let string2 = "";
        let server = NodesList.getNodesByConnectionType( CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET );
        for (let i=0; i<Math.min( server.length, 50); i++)
            string2 += '(' + server[i].socket.node.sckAddress.toString() + ')   ';
        if (server.length > 50) string2 += ".........";

        console.log("clients: ",string1);
        console.log("server: ",string2);


        // let waitlist1 = [];
        //
        // for (let waitlistFullNode of NodesWaitlist.waitListFullNodes)
        //     if ( ! waitlistFullNode.isFallback) {
        //         let obj = waitlistFullNode.toJSON();
        //         obj.score = waitlistFullNode.score;
        //         obj.connected = waitlistFullNode.connected;
        //         waitlist1.push(obj);
        //     }
        //
        // let waitlist2 = [];
        // for (let waitlistLightNode of NodesWaitlist.waitListLightNodes)
        //     if ( ! waitlistLightNode.isFallback) {
        //         let obj = waitlistLightNode.toJSON();
        //         obj.score = waitlistLightNode.score;
        //         obj.connected = waitlistLightNode.connected;
        //         waitlist2.push(obj);
        //     }

        console.log("waitlist full node ", NodesWaitlist.waitListFullNodes.length);
        console.log("waitlist light node ", NodesWaitlist.waitListLightNodes.length);

        BansList.listBans();
        AddressBanList.listBans();
    }

    _recalculateStats(nodesListObject, printStats = true){

        this.statsClients = NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET);
        this.statsServer = NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET);
        this.statsWebPeers = NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC);

        this.statsBrowsers = NodesList.countNodesByType(NODE_TYPE.NODE_WEB_PEER);
        this.statsTerminal = NodesList.countNodesByType(NODE_TYPE.NODE_TERMINAL);

        this.statsWaitlistFullNodes= NodesWaitlist.waitListFullNodes.length;
        this.statsWaitlistLightNodes = NodesWaitlist.waitListLightNodes.length;

        if (printStats)
            this._printStats();

    }
}

export default new NodesStats();
