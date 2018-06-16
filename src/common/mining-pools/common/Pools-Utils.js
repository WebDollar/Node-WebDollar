import  Utils from "common/utils/helpers/Utils"
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import Utils from "common/utils/helpers/Utils";
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from "../../blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class PoolsUtils {

    constructor(){
        this.servers = [];
    }

    validatePoolName(poolName){

        if (typeof poolName !== "string") throw {message: "pool name is not a string"};
        if (poolName !=='' && ! /^[A-Za-z\d\s]+$/.test(poolName)) throw {message: "pool name is invalid"};

    }

    validatePoolFee(poolFee){
        if ( typeof poolFee !== "number") throw {message: "pool fee is invalid"};
        if ( poolFee < 0 && poolFee > 1 ) throw {message: "pool fee is invalid"};
    }

    validatePoolWebsite(poolWebsite){
        if (typeof poolWebsite !== "string") throw {message: "pool website is not a string"};
        if (poolWebsite !== '' && ! Utils.validateUrl(poolWebsite)) throw {message:"pool website is invalid"};
    }

    validatePoolPublicKey(poolPublicKey){
        if (!Buffer.isBuffer(poolPublicKey) || poolPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "pool publicKey is not valid"};
    }

    validatePoolServers(poolServers){
        poolServers = this.processServersList( poolServers );

        if (!Array.isArray(poolServers)) throw {message: "pool servers is not an array"};
        if (poolServers.length <= 0) throw {message: "pool servers is empty"};

    }

    validatePoolActiviated( poolActivated = false){
        if (typeof poolActivated !== "boolean") throw {message: "poolActivated is not a boolean"};
    }

    validatePoolsDetails(poolName, poolFee, poolWebsite, poolAddress, poolPublicKey, poolServers, poolActivated = false){

        this.validatePoolName(poolName);
        this.validatePoolFee(poolFee);
        this.validatePoolWebsite(poolWebsite);
        this.validatePoolPublicKey(poolPublicKey);
        this.validatePoolServers(poolServers);
        this.validatePoolActiviated(poolActivated);
        if (InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(poolAddress) === null) throw {message: "poolAddress is invalid"};

        return true;
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



    extractPoolURL(url){

        if ( url === null || url === "" || url === undefined ) return null;

        let version = url.substr(0, url.indexOf( "/" ));
        url = url.substr(url.indexOf( "/" )+1);

        let poolName = url.substr(0, url.indexOf( "/" ));
        url = url.substr(url.indexOf( "/" )+1);

        let poolFee = parseFloat( url.substr(0, url.indexOf( "/" )) );
        url = url.substr(url.indexOf( "/" )+1);

        let poolAddress = url.substr(0, url.indexOf( "/" ));
        url = url.substr(url.indexOf( "/" )+1);

        let poolPublicKey = url.substr(0, url.indexOf( "/" ));
        url = url.substr(url.indexOf( "/" )+1);
        poolPublicKey = new Buffer(poolPublicKey, "hex");

        let poolWebsite = url.substr( 0, url.indexOf( "/" )).replace(/\$/g, '/' );
        url = url.substr(url.indexOf( "/" )+1);

        let poolServers = url.replace(/\$/g, '/' ).split(";");

        if (!this.validatePoolsDetails(poolName, poolFee, poolWebsite, poolAddress, poolPublicKey, poolServers)) throw {message: "validate pools "};

        return {
            poolVersion: version,
            poolName: poolName,
            poolFee: poolFee,
            poolWebsite: poolWebsite,
            poolServers: poolServers,
            poolAddress: poolAddress,
            poolPublicKey: poolPublicKey,
            poolURL: url,
        };

    }

    getPoolServersStatus(poolServers){

        if (typeof poolServers === "string") poolServers = this.processServersList( poolServers );

        let result = {};

        for (let i=0; i<poolServers.length; i++) {


            let connected = false;

            for (let j=0; j< NodesList.nodes.length; j++ )
                if (NodesList.nodes[j].socket.node.sckAddress.matchAddress( poolServers[i] )){
                    connected = true;
                    break;
                }

            result[i] = {
                name: poolServers[i],
                connected: connected,
            };

        }

        return result;

    }

}

export default new PoolsUtils();