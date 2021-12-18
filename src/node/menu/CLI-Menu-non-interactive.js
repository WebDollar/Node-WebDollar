/* eslint-disable */
import CLICore from './CLI-Core';

class CLIRunner {

    static get CORE() {
        return CLICore.INSTANCE;
    }

    /**
     *
     * @param args - string array of arguments.
     */
    constructor(args) {
        console.log("Running %o", args);
        this.args = args;
    }

    async run() {
        // process all args, then wait for mining if applicable.
        this.miningProcessStarted = false;

        while (this.args.length > 0) {
            this.args = await this.runCommand(this.args);
        }

        if (this.miningProcessStarted) {
            await this.waitForMiningToStop();
        }
    }

    async runCommand(args) {

        let [command, ...rest] = args;

        switch (command.trim()) {
            case '1': //  List addresses'
            case '-l':
            case '--list-addresses':
                await CLIRunner.CORE.listAddresses();
                break;
            case '2': //  Create new address',
            case '--create-address':
                await CLIRunner.CORE.createNewAddress();
                break;
            case '3': //  Delete Address
            case '--delete-address':
                let deleteId = rest.shift();
                await CLIRunner.CORE.deleteAddress(deleteId);
                break;
            case '4': //  Import Address
            case '--import-address':
                let walletPath = rest.shift();
                await CLIRunner.CORE.importAddress(walletPath);
                break;
            case '5': //  Export Address
            case '--export-address':
                let exportId = rest.shift();
                await CLIRunner.CORE.exportAddress(exportId);
                break;
            case '6': //  Encrypt Address
            case '--encrypt-address':
                let encryptId = rest.shift();
                await CLIRunner.CORE.encryptAddress(encryptId);
                break;
            case '7': //  Set Mining Address
            case '--mining-address':
                let pos = rest.shift();
                await CLIRunner.CORE.setMiningAddress(pos);
                break;
            case '8': //  Start Mining
            case '--mine':
                await CLIRunner.CORE.startMining();
                this.miningProcessStarted = true;
                break;
            case '9': //  Start Mining Instantly
            case '--mine-now':
                await CLIRunner.CORE.startMining(true);
                this.miningProcessStarted = true;
                break;
            case '10': // Mining Pool: Start Mining in a Pool
            case '--mine-in-pool':
                let url = rest.shift();
                await CLIRunner.CORE.startMiningInsidePool(url, false);
                this.miningProcessStarted = true;
                break;
            case '11-1':  // Mining Pool: Create a New Pool
            case '--process-payments':
                console.error('Remaining payments can\'t be processed non-interactively at this time!');
                break;
            case '11':  // Mining Pool: Create a New Pool
            case '--create-pool':
                console.error('Mining pools cannot be made non-interactively at this time!');
                break;
            case '12':  // Server Mining Pool Create a new Server for Mining Pool
            case '--create-server-for-pool':
                console.error('Mining pools cannot be made non-interactively at this time!');
                break;
            case '13': //  Import Address
            case '--sign-transaction':
                console.error('Transactions cannot be signed non-interactively at this time!');
                break;
            case '20':  // Server Mining Pool: Create a new Server for Mining Pool
            case '--start-pool-server':
                console.error('Mining Pool Servers cannot be started non-interactively at this time!');
                break;
            case '21': // Disable Forks Immutability
            case '--disable-forks-immutability':
                await CLIRunner.CORE.disableForksImmutability();
                break;
            case '22': // Disable Forks Immutability
            case '--disconnect-from-all-nodes':
                await CLIRunner.CORE.disconnectFromAllConnectedNodes();
                break;
            case '23':
            case '--disconnect-all-miners-nodes':
                await CLIRunner.CORE.disconnectAllMinersNodes();
                break;
            case '24':
            case '--set-disconnect-interval':
                await CLIRunner.CORE.setIntervalDisconnectAllMinersNodes();
                break;
            case '30':  // Set Password
            case '--set-password':
                const actualPassword = rest.shift();
                await CLIRunner.CORE.decryptWallet(actualPassword.trim().split(' '));
                break;
            case '--set-password-file':
                const passwordFile = rest.shift();
                await CLIRunner.CORE.decryptWalletFromFile(passwordFile);
                break;
            case '53': // add banlist
            case '--add-to-banlist':
                console.error('The ban list cannot be modified non-interactively at this time.');
                break;
            case '54': // load banlist
            case '--load-banlist':
                console.error('The ban list cannot be modified non-interactively at this time.');
                break;
            case '55': // save banlist
            case '--save-banlist':
                console.error('The ban list cannot be modified non-interactively at this time.');
                break;
            default: // show usage.
                CLIRunner.CORE.showCommands();
                break;
        }

        return rest;
    };

    async waitForMiningToStop() {
        console.log("Mining will continue until the SIGINT or SIGTERM signal is received.");

        let isMining = true;

        process.on('SIGINT', () =>  isMining = false);
        process.on('SIGTERM', () => isMining = false);

        const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
        return new Promise(async (resolve) => {

            const waitForMining = async () => {
                await snooze(10000);
            };

            while (isMining) {
                await waitForMining();
            }
            resolve();
        })
    }

}

export default CLIRunner;
