import {Node, Blockchain} from './index';
import consts from 'consts/const_global';
import termination from './termination';
import {JsonRpcServer} from './node/jsonRpc';

let jsonRpcConfig = {
    serverConfig: {
        host: process.env.JSON_RPC_HOST,
        port: process.env.JSON_RPC_PORT,
    },

    // @see express-basic-auth package for configuration (except isEnabled)
    basicAuth: {
        users: {},
        isEnabled: false
    },

    // @see express-rate-limit package for configuration (except isEnabled)
    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max     : 60,        // limit each IP to 100 requests per windowMs,
        isEnabled: true
    }
};

if (typeof process.env.JSON_RPC_USERNAME !== 'undefined' && typeof process.env.JSON_RPC_PASSWORD !== 'undefined')
{
    jsonRpcConfig.basicAuth.users[process.env.JSON_RPC_USERNAME] = process.env.JSON_RPC_PASSWORD;
    jsonRpcConfig.basicAuth.isEnabled = true;
}

JsonRpcServer(jsonRpcConfig);

//                            light-node
Blockchain.createBlockchain('full-node', ()=>{}, async ()=>{

    await Node.NodeExpress.startExpress();

    if (consts.DEBUG)
        await Node.NodeServer.startServer();

    Node.NodeClientsService.startService();

    Node.NodeServer.startServer();


}, ()=>{
});


process.on('SIGINT', async () => {

    await termination(Blockchain);

});
