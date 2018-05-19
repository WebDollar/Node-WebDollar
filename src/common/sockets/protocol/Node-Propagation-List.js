import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODES_TYPE from "node/lists/types/Nodes-Type"
import Blockchain from "main-blockchain/Blockchain"

class NodePropagationList{

    constructor(){

        //waitlist to be propagated to termination
        this._waitlistSimple = [];
        this._waitlistSimpleSSL = [];

        setTimeout( this._recalculateWaitlistSimple.bind(this) , 10*1000 + Math.random() * 10*1000 );
    }

    _generateWailistRandomList (number, nodes, list, onlySSL = false ) {

        if (nodes.length === 0) return;

        for (let index = 0; list.length <= number && index < nodes.length; index++){

            let node = nodes[index];

            if ( node.isFallback ){
                index++;
                continue;
            }

            let json = node.toJSON();

            if ( (!onlySSL || (onlySSL && node.sckAddresses[0].SSL === true)))
                list.push(json);

            index++;
        }

    };

    _recalculateWaitlistSimple(){

        let number = 8 + Math.floor( Math.random()*10 );

        //some from NodesList


        this._waitlistSimple = [];
        this._generateWailistRandomList( number, NodesWaitlist.waitListFullNodes, this._waitlistSimple);

        this._waitlistSimpleSSL = [];
        this._generateWailistRandomList( number, NodesWaitlist.waitListFullNodes, this._waitlistSimpleSSL, true);

        setTimeout( this._recalculateWaitlistSimple.bind(this) , 10*1000 + Math.random() * 10*1000 );

    }

    /**
     * Only supports simple Socket
     * @param socket
     * @param nodeType
     * @param disconnectSocket
     * @returns {Promise.<void>}
     */

    async propagateWaitlistSimple(socket, nodeType, disconnectSocket = true){

        if ( socket === undefined ) return;

        if (socket.emit === undefined) console.warn("socket.emit is not supported");

        let list;

        if (nodeType === NODES_TYPE.NODE_WEB_PEER) //let's send only SSL
            list = this._waitlistSimpleSSL;
        else
            list = this._waitlistSimple;

        let timeout;
        if (disconnectSocket)
            timeout = setTimeout( ()=>{ socket.disconnect() }, 7000 + Math.floor(Math.random() * 5*1000));

        socket.emit( "propagation/simple-waitlist-nodes", { op: "new-full-nodes", addresses: list }, (data)=>{

            if ( disconnectSocket )
                socket.disconnect();

            clearTimeout(timeout);

        });

        await Blockchain.blockchain.sleep(20);

    }


}
export default new NodePropagationList();