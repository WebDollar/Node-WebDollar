import GeoLocationLists from 'node/lists/geolocation-lists/GeoLocation-Lists'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NodesListObject from './Mode-List-Object.js';
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from "node/lists/types/Node-Type"
import consts from 'consts/const_global'

const EventEmitter = require('events');

/*
    The List is populated with Node Sockets only if the socket pass the Hello Message
 */

class NodesList {

    // nodes = []               - storing the connected sockets
    // events = []              - used for callbacks

    constructor(){

        console.log("NodesList constructor");

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(2000);

        this.nodes = [];
        this.nodesTotal = 0;
        this.consensusBlock = 0;

        setInterval( this.recalculateSocketsLatency.bind(this), consts.SETTINGS.PARAMS.LATENCY_CHECK );

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

        if ( !nodeType ) throw {message: "type is necessary"};

        if (!socket.node || !socket.node.protocol || !socket.node.protocol.helloValidated ) {
            socket.disconnect();
            return false;
        }

        socket.node.protocol.connectionType = connectionType;
        socket.node.protocol.nodeType = nodeType;
        socket.node.protocol.nodeConsensusType = nodeConsensusType;

        // avoiding double connections                              unless it is allowed to double connections
        if ( this.searchNodeSocketByAddress(socket, undefined, validationDoubleConnectionsTypes ) === null ) {

            // it is a unique connection, I should register this connection

            let object = new NodesListObject(socket, connectionType, nodeType, nodeConsensusType,  NodesWaitlist.isAddressFallback(socket.node.sckAddress));



            if (socket.node.protocol.nodeDomain  && socket.node.protocol.nodeDomain !== '' && ( socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL || socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER )) {

                if (socket.node.protocol.nodeDomain.indexOf("my-ip:")>=0)
                    socket.node.protocol.nodeDomain = socket.node.protocol.nodeDomain.replace("my-ip", socket.node.sckAddress.address);

                if (socket.node.protocol.nodeDomain.indexOf("browser")===0)
                    socket.node.protocol.nodeDomain = socket.node.protocol.nodeDomain.replace("browser", socket.node.sckAddress.address);

                await NodesWaitlist.addNewNodeToWaitlist(socket.node.protocol.nodeDomain, undefined, socket.node.protocol.nodeType, socket.node.protocol.nodeConsensusType, true, socket.node.level, socket, socket);

            }

            if (socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER ){ //add light waitlist
                await NodesWaitlist.addNewNodeToWaitlist( socket.node.sckAddress, undefined, socket.node.protocol.nodeType, socket.node.protocol.nodeConsensusType, true, socket.node.level, socket, socket);
            }


            GeoLocationLists.includeSocket(socket);

            await this.emitter.emit("nodes-list/connected", object);

            this.nodes.push(object);

            return true;
        }

        console.error("Already connected to ", socket.node.sckAddress.getAddress(true));
        socket.disconnect();
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    async disconnectSocket(socket, connectionType = 'all'){

        if (socket !== null && !socket.hasOwnProperty("node") ) {

            //console.error("Error - disconnectSocket rejected by invalid helloValidated");
            //if (socket.hasOwnProperty("node")) console.log("hello validated value",socket.node.protocol.helloValidated);
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


    countNodesByConnectionType(connectionType = 'all', fallback){

        let count = 0;

        for (let i=0; i<this.nodes.length; i++) {

            if (fallback  && this.nodes[i].isFallback !== fallback) continue;

            if (Array.isArray(connectionType)) { //in case type is an Array
                if (connectionType.indexOf(this.nodes[i].connectionType) >= 0)
                    count++;
            }
            else if (connectionType === this.nodes[i].connectionType || connectionType === "all")
                count++;
        }

        return count;
    }

    countNodesByType(nodeType = 'all'){

        let count = 0;

        for (let i=0; i<this.nodes.length; i++) {
            if (Array.isArray(nodeType)) { //in case type is an Array
                if (nodeType.indexOf(this.nodes[i].socket.node.protocol.nodeType) >= 0)
                    count++;
            }
            else if (nodeType === this.nodes[i].socket.node.protocol.nodeType || nodeType === "all")
                count++;
        }

        return count;
    }


    removeDisconnectedSockets(){

        for (let i=this.nodes.length-1; i>=0; i--)
            if (this.nodes[i].socket.disconnected)
                this.nodes.splice(i,1);

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

    recalculateSocketsLatency(){

        for (let i=0; i<this.nodes.length; i++)
            this.nodes[i].socket.node.protocol.calculateLatency();


    }

}

export default new NodesList();