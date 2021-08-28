/* eslint-disable */
import {JsonRpcServer} from './../jsonRpc';
var process = require('process');

let NodeExpress, NodeServer;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}


import consts from 'consts/const_global';
import AdvancedMessages from './Advanced-Messages';
import Blockchain from "main-blockchain/Blockchain"
import NodeServer from 'node/sockets/node-server/sockets/Node-Server';
import Log from 'common/utils/logging/Log';
import CLICore from "./CLI-Core";
import CLIRunner from './CLI-Menu-non-interactive';

process.on('error', (err) => {
    console.error(`Caught exception: ${err}`);
});

process.on('uncaughtException', (err) => {
    console.error(`Caught exception: ${err}`);
});

process.on('unhandledRejection', (err) => {
    console.error(`Caught exception: ${err}`);
});

class CLI {

    static get CORE() {
        return CLICore.INSTANCE;
    }

    constructor() {

        if (process.env.BROWSER)
            return;

        this._exitMenu = undefined;

        // parse cli args
        this.cliArgs = process.argv;

        Blockchain.loadWallet().then((answer)=>{
            if (!this.cliArgs.includes('--')) {
                this._startInteractive();
            } else {
                console.log("Non-interactive activated.  Args will be read from left to right.");
                this.cliArgs = this.cliArgs.splice(this.cliArgs.indexOf('--'));
                if (this.cliArgs.length <= 0) {
                    CLI.CORE.showCommands();
                }
                console.log('Working with args: %o', this.cliArgs);
                this.runner = new CLIRunner(this.cliArgs);
                this.runner.run()
                    .then(() => process.exit());
            }
        })

    }

    async _runMenu() {

        if (this._exitMenu === true) {
            AdvancedMessages.WEBD_CLI.close();
            process.exit();
            return;
        }

        let answer = await AdvancedMessages.input('Command: ');

        switch (answer.trim()) {
            case '1': //  List addresses'
                await CLI.CORE.listAddresses();
                break;
            case '2': //  Create new address',
                await CLI.CORE.createNewAddress();
                break;
            case '3': //  Delete Address
                await CLI.CORE.deleteAddress();
                break;
            case '4': //  Import Address
                await CLI.CORE.importAddress();
                break;
            case '5': //  Export Address
                await CLI.CORE.exportAddress();
                break;
            case '6': //  Encrypt Address
                await CLI.CORE.encryptAddress();
                break;
            case '7': //  Set Mining Address
                await CLI.CORE.setMiningAddress();
                break;
            case '8': //  Start Mining
                await CLI.CORE.startMining();
                break;
            case '9': //  Start Mining Instantly
                await CLI.CORE.startMining(true);
                break;
            case '10': // Mining Pool: Start Mining in a Pool
                await CLI.CORE.startMiningInsidePool();
                break;
            case '11-1':  // Mining Pool: Create a New Pool
                await CLI.CORE.processRemainingPayment();
                break;
            case '11':  // Mining Pool: Create a New Pool
                await CLI.CORE.createMiningPool();
                break;
            case '12':  // Server Mining Pool: Create a new Server for Mining Pool
                await CLI.CORE.createServerForMiningPool();
                break;
            case '13': //  Import Address
                await CLI.CORE.signTransaction();
                break;
            case '20':  // Server Mining Pool: Create a new Server for Mining Pool
                await NodeServer.startServer();
                break;
            case '21': // Disable Forks Immutability
                await CLI.CORE.disableForksImmutability();
                break;
            case '22': // Disable Forks Immutability
                await CLI.CORE.disconnectFromAllConnectedNodes();
                break;
            case '23':
                await CLI.CORE.disconnectAllMinersNodes();
                break;
            case '24':
                await CLI.CORE.setIntervalDisconnectAllMinersNodes();
                break;
            case '30':  // Set Password
                await Blockchain.Mining.setPrivateKeyAddressForMiningAddress();
                break;
            case '53': // add banlist
                await CLI.CORE.AddAddressBanList();
                break;
            case '54': // add banlist
                await CLI.CORE.LoadAddressBanList();
                break;
            case '55': // add banlist
                await CLI.CORE.SaveAddressBanList();
                break;
            case 'exit':
                this._exitMenu = true;
                break;
            default:
                CLI.CORE.showCommands();
                break;
        }

        await this._runMenu();
    };

    async _startInteractive() {

        Log.info('CLI menu started', Log.LOG_TYPE.CLI_MENU);

        CLI.CORE.showCommands();
        AdvancedMessages.WEBD_CLI.prompt();

        JsonRpcServer(consts.JSON_RPC);

        this._exitMenu = false;
        await this._runMenu();
    }

}

const lineSeparator =
    "\n|_______|____________________________________________|_________________|";

const addressHeader =
    "\n ______________________________________________________________________" +
    "\n|  NUM  |                  ADDRESS                   |      WEBD       |" +
    lineSeparator;


export default new CLI();
