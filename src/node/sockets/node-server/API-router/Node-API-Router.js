import NodeAPIPublicNodes from "../API/public/Node-API-Public-Nodes";
import NodeAPIPublicBlocks from "../API/public/Node-API-Public-Blocks";
import NodeAPIPublicAddresses from "../API/public/Node-API-Public-Addresses";
import NodeAPIPublic from "../API/Node-API-Public";

import NodeAPIPrivate from "../API/Node-API-Private";
import NodeAPICallbacks from "../API/callbacks/Node-API-Callbacks"

class NodeAPIRouter{

    constructor(){


    }

    initializeRouter(app, middleWare, prefix='', nodeApiType){

        let routes = [];

        let addRoute = (route, callback ) => {

            app(prefix+''+route, (req,res) => middleWare(req, res, callback));
            routes.push(route);

        };

        let showRoutes = ()=>{

            return routes;

        };

        // respond with "hello world" when a GET request is made to the homepage
        addRoute(prefix, NodeAPIPublic.info );

        // Return blocks information
        addRoute('blocks/between/:blocks', NodeAPIPublicBlocks.blocks );


        // Return block information
        addRoute('blocks/at/:block', NodeAPIPublicBlocks.block );

        addRoute('address/balance/:address', NodeAPIPublicAddresses.addressBalance ) ;

        if (process.env.WALLET_SECRET_URL && typeof process.env.WALLET_SECRET_URL === "string" && process.env.WALLET_SECRET_URL.length >= 30) {

            addRoute(process.env.WALLET_SECRET_URL+'/mining/balance', NodeAPIPrivate.minerBalance );

            addRoute(process.env.WALLET_SECRET_URL+'/wallets/import', NodeAPIPrivate.walletImport ) ;

            addRoute(process.env.WALLET_SECRET_URL+'/wallets/create-transaction', NodeAPIPrivate.walletCreateTransaction) ;

            addRoute(process.env.WALLET_SECRET_URL+'/wallets/export', NodeAPIPrivate.walletExport);

        }

        // Return address info: balance, blocks mined and transactions
        addRoute('address/:address', NodeAPIPublicAddresses.addressInfo );

        // Return address info: balance, blocks mined and transactions
        addRoute('server/nodes/list', NodeAPIPublicNodes.nodesList.bind(NodeAPIPublicNodes) );

        // Return blocks information
        addRoute('server/nodes/blocks-propagated', NodeAPIPublicNodes.lastBlocksMined.bind(NodeAPIPublicNodes) );

        // respond with "hello"
        addRoute('hello', NodeAPIPublic.helloWorld);

        // respond with "ping"
        addRoute('ping', NodeAPIPublic.ping);

        addRoute('list', showRoutes )

        
    }

    initializeRouterCallbacks(app, middleWare, prefix='', nodeApiType){

        app(prefix+'subscribe/address/balances', (req, res) => middleWare(req, res,  NodeAPICallbacks.addressBalancesSubscribe.bind(NodeAPICallbacks), nodeApiType ));

        app(prefix+'subscribe/address/transactions', (req, res) => middleWare(req, res,  NodeAPICallbacks.addressTransactionsSubscribe.bind(NodeAPICallbacks), nodeApiType ));

    }


    
}

export default new NodeAPIRouter();
