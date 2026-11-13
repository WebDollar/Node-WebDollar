import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";

import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List'
import NODE_TYPE from "node/lists/types/Node-Type";
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import Blockchain from "main-blockchain/Blockchain"
import NodePropagationList from 'common/sockets/protocol/Node-Propagation-List'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'

const MAX_WAITLIST_QUEUE_LENGTH = 1000;
const DOWNLOAD_WAITLIST_COUNT = 20;
const SNAPSHOT_MAX_ADDRESSES = 50; // limita deja aplicată de receptor în _processNodesList

class NodePropagationProtocol {

    constructor(){


        this._newFullNodesWaitList = {length: 0};  //for key-value
        this._newLightNodesWaitList = {length: 0}; //for key-value


        this._waitlistProccessed = {};

        this._recentlyAnnounced = new Map(); // address -> timestamp ultimei anunțări
        this.ANNOUNCE_THROTTLE_MS = 10 * 60 * 1000; // 10 minute, spec §3.4

        setTimeout( this._processNewWaitlistInterval.bind(this), 5000 + Math.random()*2000 );

    }

    async _processList(list, nodeType){

        for (let key in list){

            if (key === "length") continue;
            if (!list.hasOwnProperty(key)) continue;

            let answer = await NodesWaitlist.addNewNodeToWaitlist( key, undefined, list[key].t, list[key].ct||NODES_CONSENSUS_TYPE.NODE_CONSENSUS_PEER,  list[key].c, list[key].sock.node.level + 1, list[key].sock );

            //downloading the next elements
            if ( list[key].next && list[key].next > 0 )
                list[key].sock.node.sendRequest( (nodeType === NODE_TYPE.NODE_TERMINAL ? "propagation/request-all-wait-list/full-nodes" : "propagation/request-all-wait-list/light-nodes"), { index: list[key].next, count: this.count(list[key].sock) });

            delete list[key];
            list.length--;

            if (answer.result ){
                this._waitlistProccessed[key] = true;
                return;
            }

        }


    }

    async _processNewWaitlistInterval(){

        await this._processList(this._newFullNodesWaitList, NODE_TYPE.NODE_TERMINAL);
        await this._processList(this._newLightNodesWaitList, NODE_TYPE.NODE_WEB_PEER);


        setTimeout( async ()=>{ await this._processNewWaitlistInterval() } , 1500 + Math.floor( Math.random() * 200 ) );

    }


    initializePropagationProtocol(){

        // idempotent: a second call must not register a second listener (would announce/snapshot twice)
        if (this._propagationInitialized) return;
        this._propagationInitialized = true;

        NodesList.emitter.on("nodes-list/connected", nodeListObject => { this._newNodeConnected( nodeListObject ) } );

    }

    /**
     * True (and records the announcement) if `address` was not announced in the last ANNOUNCE_THROTTLE_MS.
     * Anti-flapping: a rapidly reconnecting peer must not spam the rest of the network with repeat gossip.
     */
    _canAnnounce(address){

        const now = Date.now();
        const last = this._recentlyAnnounced.get(address);

        if (last !== undefined && now - last < this.ANNOUNCE_THROTTLE_MS)
            return false;

        this._recentlyAnnounced.set(address, now);
        return true;
    }

    initializeSocketForPropagation(socket){

        //avoiding download the list from

        this.initializeNodesPropagation(socket);


        setTimeout( ()=>{

            if ([NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL].indexOf( socket.node.protocol.nodeConsensusType ) === 0 )
                socket.node.sendRequest("propagation/request-all-wait-list/full-nodes", { index: 0, count: this.count(socket) });

            socket.node.sendRequest("propagation/request-all-wait-list/light-nodes", { index:0, count: this.count(socket) });

        },  500 + Math.floor( Math.random()*3000));

    }

    initializeNodesSimpleWaitlist(socket){

        if (socket.propagationSet === true) return;
        socket.propagationSet = true;

        socket.on("propagation/simple-waitlist-nodes", async ( data, callback )=>{

            try{

                await this._processNodesList(data, socket);

                callback("received",{ });

            } catch (exception){

            }

        });

    }

    async _processNodesList(response, socket){

        try {

            let addresses = response.addresses || [];
            if (typeof addresses === "string") addresses = [addresses];

            if (!Array.isArray(addresses)) throw { message: "addresses is not an array" };

            if (addresses.length > 50) addresses.splice(50); //only the first 50 nodes

            let op = response.op || '';

            switch (op) {

                case "new-full-nodes":
                case "new-light-nodes":

                    let list, type;

                    if (op === "new-full-nodes") {
                        list = this._newFullNodesWaitList;
                        type = NODE_TYPE.NODE_TERMINAL
                    } else {
                        list = this._newLightNodesWaitList;
                        type = NODE_TYPE.NODE_WEB_PEER;
                    }

                    if (list.length > MAX_WAITLIST_QUEUE_LENGTH)
                        break;

                    let lastWaitlist = undefined;

                    for (let i = 0; i < addresses.length; i++){

                        if ( typeof addresses[ i ].a === "string" && list[ addresses[ i ].a ] === undefined && addresses[ i ].a !== "length"){

                            list[ addresses[ i ].a ] = {
                                a: addresses[i].a,
                                t: addresses[i].t,
                                c: addresses[i].c,
                                sock: socket,
                            };

                            lastWaitlist = list[ addresses[ i ].a ];

                            list.length++;

                            if (list.length > MAX_WAITLIST_QUEUE_LENGTH)
                                break;

                        }

                    }

                    if (lastWaitlist !== undefined && response.next !== undefined && response.next > 0  )
                        lastWaitlist.next = response.next ;

                    break;

                    //TODO remove addresses from list

                    case "disconnected-light-nodes":
                case "disconnected-full-nodes":

                    //     for (let i = 0; i < addresses.length; i++) {
                    //
                    //         let answer = NodesWaitlist._searchNodesWaitlist(addresses[i].addr, undefined, addresses[i].nodeType);
                    //         if (answer.waitlist !== null)
                    //             answer.removeBackedBy(socket.node.sckAddress);
                    //
                    //         if (i%20 === 0)
                    //             await Blockchain.blockchain.sleep(50);
                    //
                    //     }

                    break;

                default:
                    throw {message: "Op is invalid"};

            }

        }
        catch (exception){

        }

    }

    initializeNodesPropagation(socket){

        socket.on("propagation/nodes",  data => this._processNodesList(data, socket ) );

        socket.node.on("propagation/request-all-wait-list/full-nodes", response =>{

            let answer = this._getWaitlist( response, NodesWaitlist.waitListFullNodes );

            if (answer && answer.list.length > 0)
                socket.node.sendRequest("propagation/nodes", {"op": "new-full-nodes", addresses: answer.list, next: answer.next});

        });

        socket.node.on("propagation/request-all-wait-list/light-nodes", response =>{

            let answer = this._getWaitlist( response, NodesWaitlist.waitListLightNodes );

            if (answer && answer.list.length > 0)
                socket.node.sendRequest("propagation/nodes", {"op": "new-light-nodes", addresses: answer.list, next: answer.next});

        });

        this.initializeNodesSimpleWaitlist(socket);

    }

    _getWaitlist(response, list){

        try {
            let index = response.index || 0;
            let count = response.count || 50;
            count = Math.min(count, 50);
            count = Math.max(count, 5);

            let answer = [];
            for (let i = index * count; i < (index + 1) * count && i < list.length; i++)
                answer.push(list[i].toJSON());

            return {list: answer, next:  ( (index+1) * count < list.length ) ? (index+1) : 0 }

        } catch (exception){

            return null;
        }

    }

    /**
     * The reconnectable address for a newly validated peer, or null if none can be
     * trusted enough to announce.
     * For an inbound connection (we are the server), the raw socket address is the
     * client's ephemeral TCP source port, not its real listening port — unusable for
     * reconnecting. Use its self-reported domain from Hello instead, same source
     * `registerUniqueSocket` already uses for its own waitlist entry (Nodes-List.js).
     * That domain is an unvalidated string the peer sent us (Node-Server.js reads it
     * straight off the Hello query) — gossiping it unchecked would let any peer make
     * us advertise an arbitrary address to the rest of the network. We only trust it
     * when its host matches the TCP connection's real, OS-observed source IP
     * (`socket.node.sckAddress.address`, not attacker-controlled) — a peer can report
     * its own real reachable address this way, never someone else's. A peer with no
     * self-reported domain at all (e.g. a miner with no listening server) is not
     * announced — there is nothing reconnectable to tell anyone about.
     * For an outbound connection (we are the client), the raw socket address is exactly
     * what we dialed, so it's already correct.
     */
    _reconnectableAddress(nodeWaitListObject){

        const socket = nodeWaitListObject.socket;

        if (nodeWaitListObject.connectionType === CONNECTION_TYPE.CONNECTION_SERVER_SOCKET){

            const domain = socket && socket.node && socket.node.protocol && socket.node.protocol.nodeDomain;
            if (!domain) return null;

            const observedIP = socket.node.sckAddress && socket.node.sckAddress.address;
            let domainHost;
            try { domainHost = SocketAddress.createSocketAddress(domain).address; }
            catch (exception) { return null; }

            // Node/OS raportează inconsecvent o adresă IPv4 observată pe un socket
            // dual-stack: câteodată "127.0.0.1", câteodată "::ffff:127.0.0.1" —
            // verificat empiric. Normalizăm ambele părți înainte de comparare, ca
            // să nu respingem o adresă legitimă doar din cauza formatării.
            const normalize = (ip) => (ip || '').replace(/^::ffff:/i, '');

            if (!observedIP || normalize(domainHost) !== normalize(observedIP)) return null;

            return domain;
        }

        return nodeWaitListObject.toJSON().a;
    }

    _newNodeConnected( nodeWaitListObject ){

        this._announceNewPeer(nodeWaitListObject);
        this._sendKnownPeersSnapshot(nodeWaitListObject);

    }

    /**
     * Tell every other connected peer about the newly validated one (throttled per address).
     */
    _announceNewPeer( nodeWaitListObject ){

        const address = this._reconnectableAddress(nodeWaitListObject);
        if ( !address ) return;
        if ( !this._canAnnounce(address) ) return;

        const payload = Object.assign({}, nodeWaitListObject.toJSON(), {a: address});

        if (nodeWaitListObject.nodeType === NODE_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-full-nodes", addresses: [payload]}, undefined, nodeWaitListObject.socket);
        else if(nodeWaitListObject.nodeType === NODE_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-light-nodes", addresses: [payload]}, undefined, nodeWaitListObject.socket);

    }

    /**
     * Tell the newly validated peer, once, about the full-node peers THIS node has
     * itself validated (NodesList) — a snapshot on join. Without it, a peer joining
     * later only ever hears about peers that appear AFTER it, never about the ones
     * already connected. Same trust rule as the announce: only addresses this node
     * validated itself (`_reconnectableAddress`), never hearsay; the receiver treats
     * them as candidates and validates each before trusting. Bounded to one message
     * per connection, capped at the receiver-side limit of 50.
     */
    _sendKnownPeersSnapshot( newNodeObject ){

        const socket = newNodeObject.socket;
        if (!socket || !socket.node || typeof socket.node.sendRequest !== "function") return;

        const newAddress = this._reconnectableAddress(newNodeObject);
        const seen = {};
        const addresses = [];

        for (const other of NodesList.nodes){

            if (other === newNodeObject || other.socket === socket) continue;
            if (other.nodeType !== NODE_TYPE.NODE_TERMINAL) continue;

            const address = this._reconnectableAddress(other);
            if (!address || address === newAddress || seen[address]) continue;

            seen[address] = true;
            addresses.push( Object.assign({}, other.toJSON(), {a: address}) );

            if (addresses.length >= SNAPSHOT_MAX_ADDRESSES) break;
        }

        if (addresses.length === 0) return;

        socket.node.sendRequest("propagation/nodes", {op: "new-full-nodes", addresses: addresses});
    }


    count(socket){
        return [NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL].indexOf( socket.node.protocol.nodeConsensusType ) ? 15 : DOWNLOAD_WAITLIST_COUNT;
    }

}

export default new NodePropagationProtocol();
