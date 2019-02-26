import GeoLocationLists from 'node/lists/geolocation-lists/GeoLocation-Lists'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NodesListObject from './Mode-List-Object.js';
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from "node/lists/types/Node-Type"
import consts from 'consts/const_global'
import AdvancedEmitter from "common/utils/Advanced-Emitter";

/*
    The List is populated with Node Sockets only if the socket pass the Hello Message
 */

class NodesList {

    // nodes = []               - storing the connected sockets
    // events = []              - used for callbacks

    constructor(){

        console.log("NodesList constructor");

        this.emitter = new AdvancedEmitter(2000);

        this.nodes = [];
        this.consensusBlock = 0;

        this.countsNodeTypes = {
            0:0,
            1:0,
        };
        this.countsNodeConnectionTypes = {
            0:0,
            1:0,
            2:0,
        };

        setTimeout( this.recalculateSocketsLatency.bind(this), consts.SETTINGS.PARAMS.LATENCY_CHECK );

        this.removeDisconnectedSockets();
    }

    isConsensus(blockchainHeight){

        let blocksList={};
        let consensusHeightNodes=0;

        if( this.nodes.length > 0 ) {
            for (let i = 0; i < this.nodes.length; i++)
                if (this.nodes[i].socket.node.protocol.blocks && this.nodes[i].socket.node.protocol.blocks > 0)
                    if ( !blocksList[this.nodes[i].socket.node.protocol.blocks] )
                        blocksList[this.nodes[i].socket.node.protocol.blocks] = 1;
                    else
                        blocksList[this.nodes[i].socket.node.protocol.blocks]++;
        } else
            return false;

        for(let key in blocksList)
            if(blocksList[key] > consensusHeightNodes && parseInt(key) >= parseInt(this.consensusBlock)){
                consensusHeightNodes = blocksList[key];
                this.consensusBlock = parseInt(key);
            }

        if(blockchainHeight>5 && blockchainHeight > this.consensusBlock-4)
            return true;
        else
            return false

    }

    searchNodeSocketByAddress(sckAddress, connectionType = 'all', validationDoubleConnectionsTypes){

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        for (let i=0; i<this.nodes.length; i++)
            if ( (this.nodes[i].connectionType === connectionType || connectionType === "all") && (this.nodes[i].socket.node.sckAddress.matchAddress(sckAddress, validationDoubleConnectionsTypes)))
                return this.nodes[i];

        return null;
    }

    countNodeSocketByAddress(sckAddress, connectionType = "all"){

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        let countUUIDs = 0, countIPs = 0;
        for (let i=0; i<this.nodes.length; i++)
            if (this.nodes[i].connectionType === connectionType || connectionType === "all") {

                if (this.nodes[i].socket.node.sckAddress.uuid === sckAddress.uuid)
                    countUUIDs++;
                else
                if (this.nodes[i].socket.node.sckAddress.address === sckAddress.address)
                    countIPs++;
            }

        return {countUUIDs: countUUIDs, countIPs: countIPs};

    }

    async registerUniqueSocket(socket, connectionType, nodeType, nodeConsensusType, validationDoubleConnectionsTypes){

        //nodeType can be a value 0
        if ( nodeType === undefined ) throw {message: "type is necessary"};

        if (!socket.node || !socket.node.protocol || !socket.node.protocol.helloValidated ) {
            socket.disconnect();
            return false;
        }

        socket.node.protocol.connectionType = connectionType;
        socket.node.protocol.nodeType = nodeType;
        socket.node.protocol.nodeConsensusType = nodeConsensusType;

        // avoiding double connections                              unless it is allowed to double connections
        if ( !this.searchNodeSocketByAddress(socket, undefined, validationDoubleConnectionsTypes ) ) {

            // it is a unique connection, I should register this connection

            let object = new NodesListObject(socket, connectionType, nodeType, nodeConsensusType,  NodesWaitlist.isAddressFallback(socket.node.sckAddress));


            if (socket.node.protocol.nodeDomain  && ( socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL || socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER )) {

                socket.node.protocol.nodeDomain = socket.node.protocol.nodeDomain.replace("my-ip", socket.node.sckAddress.address);
                socket.node.protocol.nodeDomain = socket.node.protocol.nodeDomain.replace("browser", socket.node.sckAddress.address);

                await NodesWaitlist.addNewNodeToWaitlist(socket.node.protocol.nodeDomain, undefined, socket.node.protocol.nodeType, socket.node.protocol.nodeConsensusType, true, socket.node.level, socket, socket);

            }

            if (socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER ) //add light waitlist
                await NodesWaitlist.addNewNodeToWaitlist( socket.node.sckAddress, undefined, socket.node.protocol.nodeType, socket.node.protocol.nodeConsensusType, true, socket.node.level, socket, socket);

            GeoLocationLists.includeSocket(socket);

            await this.emitter.emit("nodes-list/connected", object);

            this.nodes.push(object);

            this.countsNodeTypes[ socket.node.protocol.nodeType ]++;
            this.countsNodeConnectionTypes[socket.node.protocol.connectionType]++;

            return true;
        }

        console.error("Already connected to ", socket.node.sckAddress.getAddress(true));
        socket.disconnect();
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    async disconnectSocket(socket, connectionType = 'all'){

        if (socket && !socket.node) {
            if (socket.connected)
                socket.disconnect();
            return false;
        }

        //console.log("disconnecting", socket, this.nodes);

        for (let i=this.nodes.length-1; i>=0; i--)
            if ((this.nodes[i].connectionType === connectionType || connectionType  === "all") &&
                (this.nodes[i].socket === socket  || this.nodes[i].socket.node.sckAddress.uuid === socket.node.sckAddress.uuid   )) {

                if ( Math.random() < 0.3)
                    console.error('deleting client socket '+ i +" "+ socket.node.sckAddress.toString());

                let nodeToBeDeleted = this.nodes[i];

                this.countsNodeTypes[ socket.node.protocol.nodeType ]--;
                this.countsNodeConnectionTypes[socket.node.protocol.connectionType]--;
                this.nodes.splice(i, 1);

                await this.emitter.emit("nodes-list/disconnected", nodeToBeDeleted);

                socket.disconnect();
                return true;
            }

        //console.error("Disconnecting Socket but it was not validated before...", socket.node.sckAddress.getAddress());

        socket.disconnect();
        return false;
    }

    //return the JOIN of the clientSockets and serverSockets
    getNodesByConnectionType( connectionType = 'all', fallback  ){

        let list = [];

        for (let i=0; i<this.nodes.length; i++)

            if ( Array.isArray(connectionType) ) { //in case type is an Array
                if ( connectionType.indexOf( this.nodes[i].socket.node.protocol.connectionType) >= 0 )
                    list.push(this.nodes[i]);
            } else
            // in case type is just a simple string
            if ( connectionType === this.nodes[i].socket.node.protocol.connectionType || connectionType === "all" )
                list.push(this.nodes[i]);

        return list;
    }

    //return the JOIN of the clientSockets and serverSockets
    getNodesByType(type = 'all'){

        let list = [];

        for (let i=0; i<this.nodes.length; i++)

            if (Array.isArray(type)) { //in case type is an Array
                if ( type.indexOf( this.nodes[i].socket.node.protocol.nodeType) >= 0)
                    list.push(this.nodes[i]);
            } else
            // in case type is just a simple string
            if (type === this.nodes[i].socket.node.protocol.nodeType || type === "all")
                list.push( this.nodes[i] );

        return list;
    }


    countNodesByConnectionType( connectionType = 'all' ){

        if (connectionType === "all") return this.countsNodeConnectionTypes[0] + this.countsNodeConnectionTypes[1] + this.countsNodeConnectionTypes[2] ;
        return this.countsNodeConnectionTypes[connectionType];

    }

    countNodesByType(nodeType = 'all'){

        if ( nodeType === "all") return this.countsNodeTypes[0] + this.countsNodeTypes[1];
        return this.countsNodeTypes[nodeType];

    }


    removeDisconnectedSockets(){

        for (let i=this.nodes.length-1; i>=0; i--)
            if (this.nodes[i].socket.disconnected) {

                this.countsNodeTypes[ this.nodes[i].socket.node.protocol.nodeType ]--;
                this.countsNodeConnectionTypes[ this.nodes[i].socket.node.protocol.connectionType ]--;

                this.nodes.splice(i, 1);
            }

        setTimeout( this.removeDisconnectedSockets.bind(this), 5000);
    }

    disconnectAllNodes(connectionType = CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET){

        for (let i=this.nodes.length-1; i>=0; i--)
            if ( this.nodes[i].socket.node.protocol.connectionType === connectionType || connectionType === "all" )
                this.nodes[i].socket.disconnect();

    }

    disconnectAllNodesByConsensusType(nodeConsensusType){

        for (let i=this.nodes.length-1; i>=0; i--)
            if ( this.nodes[i].socket.node.protocol.nodeConsensusType === nodeConsensusType )
                this.nodes[i].socket.disconnect();

    }

    disconnectFromFallbacks(){

        for (let i=this.nodes.length-1; i>=0; i--)
            if (this.nodes[i].isFallback)
                this.nodes.disconnect();

    }

    countFallbacks(){

        let count = 0;

        for (let i=this.nodes.length-1; i>=0; i--)
            if (this.nodes[i].isFallback)
                count ++;

        return count;

    }

    async recalculateSocketsLatency(){

        try{

            for (let i=0; i<this.nodes.length; i++)
                await this.nodes[i].socket.node.protocol.calculateLatency();

        }catch(exception){

        }

        setTimeout( this.recalculateSocketsLatency.bind(this), consts.SETTINGS.PARAMS.LATENCY_CHECK );
    }

}

export default new NodesList();