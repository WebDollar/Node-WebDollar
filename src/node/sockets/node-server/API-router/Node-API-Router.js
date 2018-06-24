import NodeAPIPublic from "../API/Node-API-Public";
import NodeAPIPrivate from "../API/Node-API-Private";


class NodeAPIRouter{

    initializeRouter(app, middleWare, prefix='', nodeApiType){

        // respond with "hello world" when a GET request is made to the homepage
        app.get(prefix+'/', (req, res) => middleWare(req, res, NodeAPIPublic.info, nodeApiType ));

        // Return blocks information
        app.get(prefix+'/blocks/:blocks', (req, res) => middleWare(req, res, NodeAPIPublic.blocks, nodeApiType ));

        // Return block information
        app.get(prefix+'/block/:block', (req, res) => middleWare(req, res, NodeAPIPublic.block, nodeApiType ));

        // Return address info: balance, blocks mined and transactions
        app.get(prefix+'/address/:address', (req, res) => middleWare(req, res, NodeAPIPublic.addressInfo, nodeApiType ));

        app.get(prefix+'/address/balance/:address', (req, res) => middleWare(req, res, NodeAPIPublic.addressBalance, nodeApiType) );

        if (process.env.WALLET_SECRET_URL && typeof process.env.WALLET_SECRET_URL === "string" && process.env.WALLET_SECRET_URL.length >= 30) {

            app.get(prefix+'/'+process.env.WALLET_SECRET_URL+'/mining/balance', (req, res) => middleWare(req, res, NodeAPIPrivate.minerBalance, nodeApiType) );

            app.get(prefix+'/'+process.env.WALLET_SECRET_URL+'/wallets/import', (req, res) => middleWare(req, res, NodeAPIPrivate.walletImport, nodeApiType) );

            app.get(prefix+'/'+process.env.WALLET_SECRET_URL+'/wallets/create-transaction', (req, res) => middleWare(req, res, NodeAPIPrivate.walletCreateTransaction, nodeApiType) );

            app.get(prefix+'/'+process.env.WALLET_SECRET_URL+'/wallets/export', (req, res) => middleWare(req, res, NodeAPIPrivate.walletExport, nodeApiType) );

        }

        // respond with "hello"
        app.get(prefix+'/hello', (req, res) => middleWare(req, res, NodeAPIPublic.helloWorld, nodeApiType ));

        // respond with "ping"
        app.get(prefix+'/ping', (req, res) => middleWare(req, res, NodeAPIPublic.ping, nodeApiType ));


        
    }

    
}

export default new NodeAPIRouter();