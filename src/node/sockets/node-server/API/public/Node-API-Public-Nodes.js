import NODE_TYPE from "node/lists/types/Node-Type"
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import NodesList from 'node/lists/Nodes-List'
import Blockchain from "main-blockchain/Blockchain";
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

class NodeAPIPublicNodes{

    async nodesList(req, res){

        try{

            let clients = [], servers=[];
            for (let i=0; i<NodesList.nodes.length; i++ ) {

                let geoLocation = NodesList.nodes[i].socket.node.sckAddress.geoLocation;

                let obj = {

                    adr: NodesList.nodes[i].socket.node.sckAddress.getAddress(true, true),
                    geo: geoLocation.isFulfilled() ? this._getCity ( await geoLocation ) : 'not ready',

                };

                if ( NodesList.nodes[i].socket.node.protocol.connectionType === CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET) clients.push(obj);
                else if ( NodesList.nodes[i].socket.node.protocol.connectionType === CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET) servers.push(obj);


            }

            return {result: true, clients: clients, servers: servers,};

        } catch (exception){
            return {result: false, message: exception.message};
        }


    }

    async lastBlocksMined(req, res){

        try{

            let list = [];
            for (let i = Blockchain.blockchain.blocks.length-1; i>Math.max(Blockchain.blockchain.blocks.blocksStartingPoint, Blockchain.blockchain.blocks.length-500); i--){

                let block = Blockchain.blockchain.blocks[i];

                list.push({
                    height: block.height,
                    hash: block.hash.toString("hex").substr(0, 20),
                    minerAddress:  InterfaceBlockchainAddressHelper.generateAddressWIF( block.data.minerAddress, false, true),
                    address: block._socketPropagatedBy !== undefined ? block._socketPropagatedBy.node.sckAddress.getAddress(true, true): '',
                    geoLocation: block._socketPropagatedBy !== undefined ? (block._socketPropagatedBy.node.sckAddress.geoLocation.isFulfilled() ? this._getCity ( await block._socketPropagatedBy.node.sckAddress.geoLocation) : "not ready" ) : 'na',
                });

            }

            return {result: true, list: list}

        } catch (exception){
            return {result: false, message: ""}
        }

    }



    _getCity(geoLocation){
        return geoLocation.city || geoLocation.country;
    }

}

export default new NodeAPIPublicNodes();