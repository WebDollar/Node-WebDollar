import NodeAPIPublicNodes from "../API/public/Node-API-Public-Nodes";
import NodeAPIPublicBlocks from "../API/public/Node-API-Public-Blocks";
import NodeAPIPublicAddresses from "../API/public/Node-API-Public-Addresses";
import NodeAPIPublicPools from "../API/public/Node-API-Public-Pools";
import NodeAPIPublicTransactions from "../API/public/Node-API-Public-Transactions";
import NodeAPIPublic from "../API/Node-API-Public";

import NodeAPIPrivate from "../API/Node-API-Private";
import NodeAPICallbacks from "../API/callbacks/Node-API-Callbacks"
import NodeAPIAntiDos from "../API/anti-dos/Node-API-Anti-Dos.js"


class NodeAPIRouter{

    constructor(){

        this._routes = [];
        this._routesEnabled = false;

    }

    _addRoute (route, callback, nodeApiType, maxWeight, app, prefix, middleWare ) {

        app( prefix + route, (req, res)=> NodeAPIAntiDos.protectRoute( route, () => { middleWare(req, res, callback, nodeApiType) }) );

        if (this._routesEnabled)
            this._routes.push(route);

        NodeAPIAntiDos.addRouteWeight( route, maxWeight )

    };

    showRoutes (){

        return this._routes;

    };

    initializeRouter(app, middleWare, prefix='', nodeApiType){


            // respond with "hello world" when a GET request is made to the homepage
        this._addRoute('', NodeAPIPublic.info, nodeApiType, 200, app, prefix, middleWare );

        // Return blocks information
        this._addRoute('blocks/between/:blocks', NodeAPIPublicBlocks.blocks, nodeApiType, 20 , app, prefix, middleWare );


        // Return block information
        this._addRoute( 'blocks/at/:block', NodeAPIPublicBlocks.block, nodeApiType, 20, app, prefix, middleWare );

        this._addRoute('address/balance/:address', NodeAPIPublicAddresses.addressBalance, nodeApiType,  200 , app, prefix, middleWare ) ;

        this._addRoute('address/nonce/:address', NodeAPIPublicAddresses.addressNonce, nodeApiType,  200 , app, prefix, middleWare ) ;

        if (process.env.WALLET_SECRET_URL && typeof process.env.WALLET_SECRET_URL === "string" && process.env.WALLET_SECRET_URL.length >= 30) {

            this._addRoute(process.env.WALLET_SECRET_URL+'/mining/balance', NodeAPIPrivate.minerBalance, nodeApiType, 100, app, prefix, middleWare );

            this._addRoute(process.env.WALLET_SECRET_URL+'/wallets/import/:address/:publicKey/:privateKey', NodeAPIPrivate.walletImport, nodeApiType, 100, app, prefix, middleWare );

            this._addRoute(process.env.WALLET_SECRET_URL+'/wallets/create-transaction/:from/:to/:amount/:fee', NodeAPIPrivate.walletCreateTransaction, nodeApiType, 100, app, prefix, middleWare );
            
            this._addRoute(process.env.WALLET_SECRET_URL+'/wallets/export', NodeAPIPrivate.walletExport, nodeApiType, 100, app, prefix, middleWare );

            this._addRoute(process.env.WALLET_SECRET_URL+'/wallets/create-wallet', NodeAPIPrivate.walletCreate, nodeApiType, 100, app, prefix, middleWare );

        }

        // Return address info: balance, blocks mined and transactions
        this._addRoute( 'address/:address', NodeAPIPublicAddresses.addressInfo, nodeApiType, 3 , app, prefix, middleWare );

        // Return address info: balance, blocks mined and transactions
        this._addRoute( 'server/nodes/list', NodeAPIPublicNodes.nodesList.bind(NodeAPIPublicNodes), nodeApiType, 20 , app, prefix, middleWare );

        // Return blocks information
        this._addRoute( 'server/nodes/blocks-propagated', NodeAPIPublicNodes.lastBlocksMined.bind(NodeAPIPublicNodes), nodeApiType, 20, app, prefix, middleWare );

        this._addRoute( 'pools/stats', NodeAPIPublicPools.stats, nodeApiType, 200 , app, prefix, middleWare );
        this._addRoute( 'pools/miners', NodeAPIPublicPools.miners, nodeApiType, 200 , app, prefix, middleWare );
        
        this._addRoute( 'transactions/pending', NodeAPIPublicTransactions.pending, nodeApiType, 200 , app, prefix, middleWare );
        
        // respond with "hello"
        this._addRoute( 'hello', NodeAPIPublic.helloWorld, nodeApiType, 1000, app, prefix, middleWare );

        // respond with "ping"
        this._addRoute( 'ping', NodeAPIPublic.ping, nodeApiType, 1000, app, prefix, middleWare );

        this._addRoute( 'list', this.showRoutes.bind(this), nodeApiType, 200 , app, prefix, middleWare );

    }

    initializeRouterCallbacks(app, middleWare, prefix='', nodeApiType){

        this._addRoute( 'subscribe/address/balances',  NodeAPICallbacks.addressBalancesSubscribe.bind(NodeAPICallbacks), nodeApiType, 200 , app, prefix, middleWare );
        this._addRoute( 'subscribe/address/transactions',  NodeAPICallbacks.addressTransactionsSubscribe.bind(NodeAPICallbacks), nodeApiType, 100 , app, prefix, middleWare );

    }


    
}

export default new NodeAPIRouter();
