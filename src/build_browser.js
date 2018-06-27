import {Node, Blockchain} from './index.js';
import global from "consts/global.js";
import termination from "./termination";

console.log("BROWSER MODE");

//Blockchain.createBlockchain("headers-node");
Blockchain.createBlockchain("light-node", ()=>{
    Node.NodeClientsService.startService();
    Node.NodeWebPeersService.startService();
});

window.onbeforeunload = async () => {

    await termination(Blockchain);

};

