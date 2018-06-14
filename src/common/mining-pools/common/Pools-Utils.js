import  Utils from "common/utils/helpers/Utils"
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"

class PoolsUtils {

    constructor(){
        this.servers = [];
    }

    async insertServersListWaitlist(serversListArray, nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL ){

        if (!Array.isArray(serversListArray) || serversListArray.length === 0) return false;

        NodesWaitlist.deleteWaitlistByConsensusNode(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER);
        NodesWaitlist.deleteWaitlistByConsensusNode(nodeConsensusType);

        //disconnect all nodes

        for (let i=0; i<NodesList.nodes.length; i++)
            if (NodesList.nodes[i].socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER || NodesList.nodes[i].socket.node.protocol.nodeConsensusType === nodeConsensusType )
                NodesList.nodes[i].socket.node.protocol._checked = false;


        //Add new Waitlist

        for (let i=0; i<serversListArray.length; i++){

            let server = serversListArray[i];

            let answer = await NodesWaitlist.addNewNodeToWaitlist( server, undefined, NODE_TYPE.NODE_TERMINAL, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER, undefined, undefined, undefined, undefined, true );
            let waitlistObject = answer.waitlist;

            if ( waitlistObject !== null && waitlistObject.nodeConsensusType !== NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER)
                waitlistObject.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER;

            //check the nodes that matches the waitlists

            for (let j=0; j<NodesList.nodes.length; j++)
                if (NodesList.nodes[j].socket.node.sckAddress.matchAddress( waitlistObject.sckAddresses[0] )) {

                    if (NodesList.nodes[j].socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_PEER)
                        NodesList.nodes[j].socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER;

                    NodesList.nodes[j].socket.node.protocol._checked = true;
                }

        }

        //remove the nodes that don't match the waitlists

        for (let j=NodesList.nodes.length-1; j>=0; j--) {
            if (NodesList.nodes[j].socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER || NodesList.nodes[j].socket.node.protocol.nodeConsensusType === nodeConsensusType)
                if (!NodesList.nodes[j].socket.node.protocol._checked) {
                    NodesList.nodes[j].socket.disconnect();
                    NodesList.nodes.splice(j, 1);
                }

            delete NodesList.nodes[j].socket.node.protocol._checked;
        }

    }

    processServersList(serversList){

        if (typeof serversList === "string") serversList =  serversList.split(/[\s,]+/);

        if (!Array.isArray(serversList)) throw {message: "serversList is not array"};

        for (let i=serversList.length-1; i>=0; i--){

            serversList[i] = serversList[i].replace(/\s+/, "");
            if (serversList[i] === ''){

                if (serversList.length === 1)
                    serversList = [];
                else
                    serversList.splice(i,1);
            }

        }

        for (let i=0; i<serversList.length; i++)
            if ( !Utils.validateUrl( serversList[i] ) ) throw {message: "serversList element is not a valid url", url: serversList[i]}

        return serversList;
    }

    convertServersList(servers){

        let string = '';

        for (let key in  servers ){
            string += servers[key]+"\n";
        }

        return string;
    }

}

export default new PoolsUtils();