const process = require('process');

import {Node, Blockchain} from './index';
import consts from 'consts/const_global';
import termination from './termination';
import {JsonRpcServer} from './node/jsonRpc';

JsonRpcServer(consts.JSON_RPC);

process.on('error', (err) => {
    console.error(`Caught exception: ${err}`);
});

process.on('uncaughtException', (err) => {
    console.error(`Caught exception: ${err}`);
});

process.on('unhandledRejection', (err) => {
    console.error(`Caught exception: ${err}`);
});

//                            light-node
Blockchain.createBlockchain('full-node', () => {}, async () => {

    await Node.NodeExpress.startExpress();

    if (consts.DEBUG)
        await Node.NodeServer.startServer();

    Node.NodeClientsService.startService();

    Node.NodeServer.startServer();
}, () => {
});


// Salvare periodică a stării (minute; 0 = dezactivat), ca o oprire forțată să nu piardă sincronizarea
{
    const minutes = process.env.CHECKPOINT_INTERVAL_MINUTES === undefined ? 10 : parseInt(process.env.CHECKPOINT_INTERVAL_MINUTES);
    if (minutes > 0)
        setInterval(() => { Blockchain.blockchain.blocks.savingManager.saveCheckpoint().catch(() => {}); }, minutes * 60 * 1000);
}

process.on('SIGINT', async () => {
    await termination(Blockchain);
});
