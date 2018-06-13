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
        NodesList.disconnectAllNodesByConsensusType(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER);

        NodesWaitlist.deleteWaitlistByConsensusNode(nodeConsensusType);
        NodesList.disconnectAllNodesByConsensusType(nodeConsensusType);

        for (let i=0; i<serversListArray.length; i++){

            let server = serversListArray[i];

            let waitlistObject = await NodesWaitlist.addNewNodeToWaitlist( server, undefined, NODE_TYPE.NODE_TERMINAL, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER, undefined, undefined, undefined, undefined, true );

            if (waitlistObject !== null && waitlistObject.nodeConsensusType !== NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER){
                waitlistObject.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER;
            }

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