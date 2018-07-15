import NodeAPIPublicNodes from "../API/public/Node-API-Public-Nodes";
import NodeAPIPublicBlocks from "../API/public/Node-API-Public-Blocks";
import NodeAPIPublicAddresses from "../API/public/Node-API-Public-Addresses";
import NodeAPIPublic from "../API/Node-API-Public";

import NodeAPIPrivate from "../API/Node-API-Private";
import NodeAPICallbacks from "../API/callbacks/Node-API-Callbacks"

class NodeAPIRouter{

    initializeRouter(app, middleWare, prefix='', nodeApiType){

        // respond with "hello world" when a GET request is made to the homepage
        app(prefix, (req, res) => middleWare(req, res, NodeAPIPublic.info ));

        // Return blocks information
        app(prefix+'blocks/between/:blocks', (req, res) => middleWare(req, res, NodeAPIPublicBlocks.blocks ));


        // Return block information
        app(prefix+'blocks/at/:block', (req, res) => middleWare(req, res, NodeAPIPublicBlocks.block ));

        app(prefix+'address/balance/:address', (req, res) => middleWare(req, res, NodeAPIPublicAddresses.addressBalance ) );

        if (process.env.WALLET_SECRET_URL && typeof process.env.WALLET_SECRET_URL === "string" && process.env.WALLET_SECRET_URL.length >= 30) {

            app(prefix+''+process.env.WALLET_SECRET_URL+'/mining/balance', (req, res) => middleWare(req, res, NodeAPIPrivate.minerBalance ) );

            app(prefix+''+process.env.WALLET_SECRET_URL+'/wallets/import', (req, res) => middleWare(req, res, NodeAPIPrivate.walletImport ) );

            app(prefix+''+process.env.WALLET_SECRET_URL+'/wallets/create-transaction', (req, res) => middleWare(req, res, NodeAPIPrivate.walletCreateTransaction) );

            app(prefix+''+process.env.WALLET_SECRET_URL+'/wallets/export', (req, res) => middleWare(req, res, NodeAPIPrivate.walletExport) );

        }

        // Return address info: balance, blocks mined and transactions
        app(prefix+'address/:address', (req, res) => middleWare(req, res, NodeAPIPublicAddresses.addressInfo ));

        // Return address info: balance, blocks mined and transactions
        app(prefix+'server/nodes/list', (req, res) => middleWare(req, res, NodeAPIPublicNodes.nodesList.bind(NodeAPIPublicNodes) ));

        // Return blocks information
        app(prefix+'server/nodes/blocks-propagated', (req, res) => middleWare(req, res, NodeAPIPublicNodes.lastBlocksMined.bind(NodeAPIPublicNodes) ));

        // respond with "hello"
        app(prefix+'hello', (req, res) => middleWare(req, res, NodeAPIPublic.helloWorld));

        // respond with "ping"
        app(prefix+'ping', (req, res) => middleWare(req, res, NodeAPIPublic.ping));


        
    }

    initializeRouterCallbacks(app, middleWare, prefix='', nodeApiType){

        app(prefix+'subscribe/address/balances', (req, res) => middleWare(req, res,  NodeAPICallbacks.addressBalancesSubscribe.bind(NodeAPICallbacks), nodeApiType ));

        app(prefix+'subscribe/address/transactions', (req, res) => middleWare(req, res,  NodeAPICallbacks.addressTransactionsSubscribe.bind(NodeAPICallbacks), nodeApiType ));

    }

    
}

export default new NodeAPIRouter();
