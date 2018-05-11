import Blockchain from "main-blockchain/Blockchain"
import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list';

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

        setTimeout( this.processPropagation.bind(this), 300);

        //remove disconnected sockets
        setInterval( this._deleteDisconenctedSockets.bind(this), 20000)
    }

    propagateBlock(block, socketsAvoidBroadcast){

        //verifiy if I am propagating a better block
        if (this._blockPropagating !== undefined && this._blockPropagating === block) return;

        if ( socketsAvoidBroadcast === "all") return;

        this._socketsAlreadyBroadcast = [];

        if (socketsAvoidBroadcast !== undefined && socketsAvoidBroadcast !== "all") {

            if (! Array.isArray(socketsAvoidBroadcast) )
                socketsAvoidBroadcast = [socketsAvoidBroadcast];

            this._socketsAlreadyBroadcast = socketsAvoidBroadcast;

        }

        this._blockPropagating = block;

    }

    processPropagation() {

        let block = this._blockPropagating;

        if (block === undefined){
            setTimeout( this.processPropagation.bind(this), 300 );
            return true;
        }

        if (this._socketsPropagating.length < consts.SETTINGS.PARAMS.CONNECTIONS.SOCKETS_TO_PROPAGATE_NEW_BLOCK_TIP) {

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

                }, 200);

            }


        }

        setTimeout( this.processPropagation.bind(this), 300 );

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

    _deleteDisconenctedSockets(){

        for (let i=this._socketsAlreadyBroadcast.length-1; i>=0; i--)
            if (this._socketsAlreadyBroadcast[i].disconnected)
                this._socketsAlreadyBroadcast.splice(i,1);

        for (let i=this._socketsPropagating.length-1; i>=0; i--)
            if (this._socketsPropagating[i].disconnected)
                this._socketsPropagating.splice(i,1);


    }

}

export default new NodeBlockchainPropagation();