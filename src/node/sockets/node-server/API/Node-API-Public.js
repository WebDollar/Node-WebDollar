import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from "node/lists/types/Node-Type"
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import NodesList from 'node/lists/Nodes-List'
import Blockchain from "main-blockchain/Blockchain"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

class NodeAPIPublic{

    constructor(){

    }

    info(){
        let lastBlock = Blockchain.blockchain.blocks.last;

        return {

            protocol: consts.SETTINGS.NODE.PROTOCOL,
            version: consts.SETTINGS.NODE.VERSION,
            blocks: {
                length: Blockchain.blockchain.blocks.length,
                lastBlockHash: lastBlock !== undefined ? Blockchain.blockchain.blocks.last.hash.toString("hex") : '',
            },
            networkHashRate: Blockchain.blockchain.blocks.networkHashRate,
            sockets:{
                clients: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET),
                servers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET),
                webpeers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC),
            },
            services:{
                serverPool: Blockchain.ServerPoolManagement.serverPoolProtocol.loaded,
                miningPool: Blockchain.PoolManagement.poolProtocol.loaded,
                minerPool: Blockchain.MinerPoolManagement.minerPoolProtocol.loaded,
            },
            waitlist:{
                list: NodesWaitlist.getJSONList( NODE_TYPE.NODE_TERMINAL, false ),
            }

        };
    }

    blocks(req, res){

        let block_start = req.block_start;

        try {

            if (block_start >= Blockchain.blockchain.blocks.length) throw {message: "block start is not correct: " + block_start};

            let blocks_to_send = [];
            for (let i=block_start; i<Blockchain.blockchain.blocks.length; i++)
                blocks_to_send.push(Blockchain.blockchain.blocks[i].toJSON())

            return {result: true, blocks: blocks_to_send};

        } catch (exception) {
            return {result: false, message: exception.message};
        }

    }

    block(req, res){

        let block = req.block;

        try {
            if (block < Blockchain.blockchain.blocks.length) throw {message: "Block not found."};

            return {result: true, block: Blockchain.blockchain.blocks[block].toJSON()}

        } catch (exception) {
            return {result: false, message: "Invalid Block"};
        }

    }


    //Get Address
    //TODO: optimize or limit the number of requests

    addressInfo(req, res){

        let address = req.address;

        try {
            address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        } catch (exception){
            return {result: false, message: "Invalid Address"};
        }

        let answer = [];
        let minedBlocks = [];
        let balance = 0;
        let last_block = Blockchain.blockchain.blocks.length;

        // Get balance
        balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);
        balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

        // Get mined blocks and transactions
        for (let i=0; i<Blockchain.blockchain.blocks.length; i++) {

            for (let j = 0; j < Blockchain.blockchain.blocks[i].data.transactions.transactions.length; j++) {

                let transaction = Blockchain.blockchain.blocks[i].data.transactions.transactions[j];

                let found = false;
                for (let q = 0; q < transaction.from.addresses.length; q++)
                    if (transaction.from.addresses[q].unencodedAddress.equals(address)) {
                        found = true;
                        break;
                    }

                for (let q = 0; q < transaction.to.addresses.length; q++)
                    if (transaction.to.addresses[q].unencodedAddress.equals(address)) {
                        found = true;
                        break;
                    }

                if (found) {
                    answer.push({
                        blockId: Blockchain.blockchain.blocks[i].height,
                        timestamp: Blockchain.blockchain.blocks[i].timeStamp + BlockchainGenesis.timeStamp,
                        transaction: transaction.toJSON()
                    });
                }

            }
            if (Blockchain.blockchain.blocks[i].data.minerAddress.equals(address)) {
                minedBlocks.push(
                    {
                        blockId: Blockchain.blockchain.blocks[i].height,
                        timestamp: Blockchain.blockchain.blocks[i].timeStamp + BlockchainGenesis.timeStamp,
                        transactions: Blockchain.blockchain.blocks[i].data.transactions.transactions.length
                    });
            }
        }


        return {result: true, last_block: last_block,
            balance: balance, minedBlocks: minedBlocks,
            transactions: answer
        };

    }

    addressBalance(req, res){

        let address = req.address;

        try {
            address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        } catch (exception){
            return {result: false, message: "Invalid Address"};
        }

        let balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);

        balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

        return {result: true, balance: balance};

    }

    helloWorld(req, res){
        return {hello: "world" };
    }

    ping(req, res){
        return {ping: "pong"};
    }

}

export default new NodeAPIPublic();
