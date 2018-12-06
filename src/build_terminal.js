import {Node, Blockchain} from './index';
import global from "consts/global";
import consts from "consts/const_global";
import termination from "./termination";
import {JsonRpcServer} from './node/jsonRpc';

//                            light-node

Blockchain.createBlockchain("full-node", ()=>{}, async ()=>{

    await Node.NodeExpress.startExpress();

    if (consts.DEBUG)
        await Node.NodeServer.startServer();

    Node.NodeClientsService.startService();

    Node.NodeServer.startServer();

    let jsonRpcConfig = {
        port: process.env.JSON_RPC_PORT || 3334,
        basicAuth: {
            users: {},
            isEnabled: false
        }
    };

    if (process.env.JSON_RPC_USERNAME !== '' && process.env.JSON_RPC_PASSWORD !== '')
    {
        jsonRpcConfig.basicAuth.users[process.env.JSON_RPC_USERNAME] = process.env.JSON_RPC_PASSWORD;
        jsonRpcConfig.basicAuth.isEnabled = true;
    }

    JsonRpcServer(jsonRpcConfig);

}, ()=>{
});


process.on('SIGINT', async () => {

    await termination(Blockchain);

});
