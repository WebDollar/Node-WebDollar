import Blockchain from "main-blockchain/Blockchain"
import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List';
import NodeProtocol from "../extend-socket/Node-Protocol";
import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";

const INTERVAL_PROPAGATION = 300;

class NodeBlockchainPropagation{

    constructor(){

        this._blockPropagating = undefined;
        this._socketsAlreadyBroadcast = [];
        this._socketsPropagating = [];

        //make sure we delete their references
        NodesList.emitter.on("nodes-list/disconnected", (nodeListObject) => {

            for (let i=this._socketsAlreadyBroadcast.length-1; i>=0; i--)
                if (this._socketsAlreadyBroadcast[i] === nodeListObject.socket)
                    this._socketsAlreadyBroadcast.slice(i,1);

            for (let i=this._socketsPropagating.length-1; i>=0; i--)
                if (this._socketsPropagating[i] === nodeListObject.socket)
                    this._socketsPropagating.slice(i,1);

        });

        setTimeout( this.processPropagation.bind(this), INTERVAL_PROPAGATION);

        //remove disconnected sockets
        setInterval( this._deleteDisconnectedSockets.bind(this), 20000)
    }

    propagateBlock(block, socketsAvoidBroadcast){

        //verifiy if I am propagating a better block
        if (this._blockPropagating !== undefined && this._blockPropagating === block) return;

        if ( socketsAvoidBroadcast === "all") return;

        this._socketsAlreadyBroadcast = [];

        if (socketsAvoidBroadcast && socketsAvoidBroadcast !== "all") {

            if (! Array.isArray(socketsAvoidBroadcast) )
                socketsAvoidBroadcast = [socketsAvoidBroadcast];

            //avoid sending to those sockets
            for (let i=0; i < NodesList.nodes.length; i++)
                if ( Blockchain.isPoolActivated  && ( [NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL, NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER].indexOf(NodesList.nodes[i].socket.node.protocol.nodeConsensusType) >= 0  ))
                    socketsAvoidBroadcast.push(NodesList.nodes[i].socket);

            this._socketsAlreadyBroadcast = socketsAvoidBroadcast;

        }

        this._blockPropagating = block;

    }

    propagateLastBlockFast(suspendOtherBlocks = true){

        if (suspendOtherBlocks) {
            this._blockPropagating = undefined;
            this._socketsPropagating = [];
            this._socketsAlreadyBroadcast = [];
        }

        //sending the block, except poolMiners
        for (let i=0; i < NodesList.nodes.length; i++)
            if ( !Blockchain.isPoolActivated  || ( [NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL, NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER].indexOf(NodesList.nodes[i].socket.node.protocol.nodeConsensusType) < 0  ))
                NodesList.nodes[i].socket.node.protocol.sendLastBlock();

    }

    processPropagation() {

        let block = this._blockPropagating;

        if (block && this._socketsPropagating.length < consts.SETTINGS.PARAMS.CONNECTIONS.SOCKETS_TO_PROPAGATE_NEW_BLOCK_TIP) {

            let list = [];
            for (let i=0; i<NodesList.nodes.length; i++)
                if (!this._findSocket(NodesList.nodes[i].socket))
                    list.push(NodesList.nodes[i].socket);


            while ( list.length > 0 && this._socketsPropagating.length < consts.SETTINGS.PARAMS.CONNECTIONS.SOCKETS_TO_PROPAGATE_NEW_BLOCK_TIP ) {

                let index = Math.floor( Math.random() * list.length );

                let socket = list[index];
                list.splice(index,1);

                this._socketsPropagating.push(socket);

                //let send the block, but once we receive any kind of confirmation, we need to delete it from the socketsWaitlist
                socket.node.protocol.sendLastBlock();

                setTimeout(()=>{

                    if (block === this._blockPropagating){

                        if (socket.disconnected)
                            return;

                        this._socketsAlreadyBroadcast.push(socket);
                    }

                    //delete it from the list
                    for (let i=this._socketsPropagating.length; i>=0; i-- )
                        if (this._socketsPropagating[i] === socket)
                            this._socketsPropagating.splice(i,1);

                }, 100 + Math.random()*200 );

            }


        }

        setTimeout( this.processPropagation.bind(this), INTERVAL_PROPAGATION );

    }


    _findSocket(socket) {

        for (let i=0; i<this._socketsPropagating.length; i++)
            if (this._socketsPropagating[i] === socket  )
                return true;

        for (let i=0; i<this._socketsAlreadyBroadcast.length; i++)
            if (this._socketsAlreadyBroadcast[i] === socket)
                return true;

        return false;
    }

    _deleteDisconnectedSockets(){

        for (let i=this._socketsAlreadyBroadcast.length-1; i>=0; i--)
            if (this._socketsAlreadyBroadcast[i].disconnected)
                this._socketsAlreadyBroadcast.splice(i,1);

        for (let i=this._socketsPropagating.length-1; i>=0; i--)
            if (this._socketsPropagating[i].disconnected)
                this._socketsPropagating.splice(i,1);


    }

}

export default new NodeBlockchainPropagation();