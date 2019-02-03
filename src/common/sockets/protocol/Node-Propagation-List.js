import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from "node/lists/types/Node-Type"
import Blockchain from "main-blockchain/Blockchain"

class NodePropagationList{

    constructor(){

        //waitlist to be propagated to termination
        this._waitlistSimple = [];
        this._waitlistSimpleSSL = [];

        setTimeout( this._recalculateWaitlistSimple.bind(this) , 5*1000 + Math.random() * 5*1000 );
    }

    _getWailistElements (number, nodes, answer, onlySSL = false ) {

        if (nodes.length === 0) return;

        let list = [];

        for (let index = 0; index < nodes.length; index++){

            let node = nodes[index];

            if ( node.isFallback ){
                index++;
                continue;
            }

            if ( (!onlySSL || (onlySSL && node.sckAddresses[0].SSL === true)))
                list.push(node.toJSON());

        }

        //first number
        for (let i=0; i<number && answer.length < list.length; i++)
            answer.push(list[i]);

        let index = 0 ;
        while (index < number && answer.length < list.length){

            let pos = Math.floor( Math.random()*list.length );
            let found = false;

            for (let i=0; i<answer.length; i++)
                if (answer[i].a === list[pos].a ){
                    found = true;
                    break;
                }

            if (!found){
                answer.push(list[pos]);
            }

        }


    };


    _recalculateWaitlistSimple(){

        let number = 8 + Math.floor( Math.random()*10 );

        //some from NodesList


        this._waitlistSimple = [];
        this._getWailistElements( number, NodesWaitlist.waitListFullNodes, this._waitlistSimple);

        this._waitlistSimpleSSL = [];
        this._getWailistElements( number, NodesWaitlist.waitListFullNodes, this._waitlistSimpleSSL, true);

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

        if ( !socket ) return;

        if ( !socket.emit ) console.warn("socket.emit is not supported");

        let list;

        if (nodeType === NODE_TYPE.NODE_WEB_PEER) //let's send only SSL
            list = this._waitlistSimpleSSL;
        else
            list = this._waitlistSimple;

        let timeout;
        if (disconnectSocket)
            timeout = setTimeout( ()=>{
                console.error("Disconnected by simple waitlist1");
                socket.disconnect()
            }, 7000 + Math.floor(Math.random() * 5*1000));

        socket.emit( "propagation/simple-waitlist-nodes", { op: "new-full-nodes", addresses: list }, (data)=>{

            if ( disconnectSocket ) {
                console.error("Disconnected by simple waitlist");
                socket.disconnect();
            }

            clearTimeout(timeout);

        });

        await Blockchain.blockchain.sleep(20);

    }


}
export default new NodePropagationList();