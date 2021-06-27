/* eslint-disable */
import CONNECTION_TYPE from '../lists/types/Connection-Type';
import NODES_CONSENSUS_TYPE from '../lists/types/Node-Consensus-Type';
import consts from 'consts/const_global';
import { Node } from '../../index.js';
import AdvancedMessages from './Advanced-Messages';
import WebDollarCoins from 'common/utils/coins/WebDollar-Coins';
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';
import Blockchain from 'main-blockchain/Blockchain';
import StatusEvents from 'common/events/Status-Events';
import Log from 'common/utils/logging/Log';
import AddressBanList from 'common/utils/bans/AddressBanList';


const FileSystem = require('fs');
const readline = require('readline');

let NodeExpress, NodeServer;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}


export class CLICore {

    static get INSTANCE() {
        return new CLICore();
    }

    constructor() {}

    signTransaction() {

        console.info('Sign Transaction');

        return new Promise(async (resolve) => {

            let addressId = await this._chooseAddress();

            if (addressId < 0) {
                console.warn("You must enter a valid number.");
                resolve(false);
                return;
            }

            let toAddress = await AdvancedMessages.input('Enter the recipient address: ');
            let amountToSend = await AdvancedMessages.input('Enter the transaction amount: ');
            let nonce = await AdvancedMessages.input('Enter the address current nonce: ');
            let timelock = await AdvancedMessages.input('Enter the current block: ');
            let addressPath = await AdvancedMessages.input('Enter path for saving the transaction:');
            let wantToPropagate = await AdvancedMessages.input('Do you want to propagate now y/n?:');

            if (wantToPropagate.toUpperCase().trim() === 'Y') wantToPropagate = true;
            else wantToPropagate = false;

            let feeToSend = Blockchain.Transactions.wizard.calculateFeeSimple(amountToSend);

            let addressString = Blockchain.Wallet.addresses[addressId].address;
            let answer = null;

            //Trick for blocks length and address nonce
            Blockchain.blockchain.blocks._length = timelock + 1;

            for (let i = 0; i < Blockchain.Wallet.addresses.length; i++)
                if (addressString === Blockchain.Wallet.addresses[i].address)
                    answer = await Blockchain.Transactions.wizard.validateTransaction(Blockchain.Wallet.addresses[i].address, toAddress, amountToSend * WebDollarCoins.WEBD, feeToSend, undefined, undefined, timelock - 1, nonce, true);

            let data = {};

            if (answer.result) {

                data.transaction = answer.transaction.serializeTransaction();
                data.signature = answer.signature;

                if (wantToPropagate)
                    await Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(answer.transaction, undefined, true);

            } else {

                console.log("Transaction was not created. " + answer.message);
                resolve(false);
                return;

            }

            FileSystem.writeFile(addressPath + "transaction.tx", JSON.stringify(data), 'utf8', (err) => {

                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }

                console.log("Transaction successfully exported to ," + addressPath + "transaction.tx");

                resolve(true);

            });

            resolve(true);

        });

    }

    async processRemainingPayment() {

        await this._callCallbackBlockchainSync(undefined, undefined, undefined, async () => {
            await Blockchain.PoolManagement.poolRemainingRewards.doPayout();
        }, true);

    }

    async _chooseAddress(id ) {

        await this.listAddresses();

        let addressId = !!id ? id : await AdvancedMessages.readNumber('Choose the address number: ');

        if (isNaN(addressId) || addressId < 0 || Blockchain.Wallet.addresses.length <= addressId)
            return -1;

        return addressId;
    }

    async AddAddressBanList() {

        let addressWIF = await AdvancedMessages.input('Please input miner address: ');
        if (addressWIF.length == 40) {
            let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);
            if (unencodedAddress) {
                let duration = await AdvancedMessages.readNumber('Ban duration (hours): ');
                let reason = await AdvancedMessages.input('Please input ban reason: ');
                reason = reason.replace(';', '.,');
                AddressBanList.addBan(unencodedAddress, duration * 3600 * 1000, reason);
                AddressBanList.listBans();
            }
        }

    }

    async LoadAddressBanList() {

        try {

            const file = FileSystem.createReadStream('address-ban-list.txt');

            const rl = readline.createInterface({
                input: file,
                crlfDelay: Infinity
            });

            rl.on('error',  (err) => {
                console.error('Address ban list was not found');
            });

            file.on('error',  (err) => {
                console.error('Address ban list was not found');
            });

            rl.on('line', (line) => {
                let triplet = line.split(';');
                if (triplet.length === 3) {

                    let duration = parseFloat(triplet[0]);
                    let addressWIF = triplet[1];
                    let reason = triplet[2];

                    if (addressWIF && addressWIF.length == 40) {
                        let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);
                        if (unencodedAddress)
                            AddressBanList.addBan(unencodedAddress, duration * 3600 * 1000, reason);
                    }
                } else console.log("Invalid line in address-ban-list.txt", line);
            });

            rl.on('close', () => {
                AddressBanList.listBans();
            });

        } catch (exception) {
            console.error("Error loading banlist: ", exception);
        }
    }

    async SaveAddressBanList() {
        AddressBanList.saveBans();
    }

    async listAddresses() {


        console.warn("INFO: YOU NEED TO BE SYNC TO SEE THE VALUE OF YOUR WALLET!!!");
        console.info('\nWallet addresses:');

        let miningAddress = Blockchain.blockchain.mining.minerAddress;
        if ( !miningAddress )
            miningAddress = 'not specified';

        console.log(addressHeader);
        for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {

            let address = Blockchain.Wallet.addresses[i].address;

            let balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);

            balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

            if (address === miningAddress)
                console.log(((i < 10) ? "|  *" : "| *") + i + "   |  " + address + "  | " + balance + lineSeparator);
            else
                console.log(((i < 10) ? "|   " : "|  ") + i + "   |  " + address + "  | " + balance + lineSeparator);

        }

        let balance = 0;
        if (miningAddress !== 'not specified') {
            balance = Blockchain.blockchain.accountantTree.getBalance(miningAddress, undefined);
            balance = (balance === null) ? 0 : balance;

            if (Blockchain.MinerPoolManagement && Blockchain.MinerPoolManagement.minerPoolStarted)
                balance += Blockchain.MinerPoolManagement.minerPoolReward.total;

            balance /= WebDollarCoins.WEBD;


        }
        console.log("| MINING|  " + miningAddress + "  | " + balance + lineSeparator);

        return true;

    }

    async createNewAddress() {

        console.info('Create new address.');
        try {
            let address = await Blockchain.Wallet.createNewAddress();
            console.info("Address was created: " + address.address);
            return true;
        } catch (err) {
            console.err(err);
            return false;
        }

    }

    async deleteAddress(id) {

        console.info('Delete address.');

        let addressId = await this._chooseAddress(id);

        if (addressId < 0) {
            console.warn("You must enter a valid number.");
            return false;
        }

        let response = await Blockchain.Wallet.deleteAddress(Blockchain.Wallet.addresses[addressId].address);

        return response.result;
    }

    importAddress(path) {

        console.info('Import address.');

        return new Promise(async (resolve) => {
            path = !!path ? path : await AdvancedMessages.input('Enter address path: ');

            FileSystem.readFile(path, 'utf8', async (err, content) => {

                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }

                try {

                    let answer = await Blockchain.Wallet.importAddressFromJSON(JSON.parse(content));

                    if (answer.result === true) {
                        console.log("Address successfully imported", answer.address);
                        await Blockchain.Wallet.saveWallet();

                        if (Blockchain.Wallet.addresses.length === 1) Blockchain.blockchain.mining.minerAddress = Blockchain.Wallet.addresses[0].address;

                        resolve(true);
                    } else {
                        console.error(answer.message);
                        resolve(false);
                    }

                } catch (err) {
                    console.error(err.message);
                    resolve(false);
                }
            });
        });

    }

    exportAddress(id) {

        console.info('Export address.');

        return new Promise(async (resolve) => {

            let addressId = await this._chooseAddress(id);

            if (addressId < 0) {
                console.warn("You must enter a valid number.");
                resolve(false);
                return;
            }

            let addressPath = await AdvancedMessages.input('Enter path for saving address: ');

            let addressString = Blockchain.Wallet.addresses[addressId].address;
            let fileName = "WEBD$" + Blockchain.Wallet.addresses[addressId].unencodedAddress.toString("hex") + ".webd";

            let answer = await Blockchain.Wallet.exportAddressToJSON(addressString);

            if (answer.result === false) {
                console.log("Address was not exported. :(. " + answer.message);
                resolve(false);
                return;
            }

            let jsonAddress = JSON.stringify(answer.data);

            FileSystem.writeFile(addressPath + fileName, jsonAddress, 'utf8', (err) => {

                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }

                console.log("Address successfully exported", addressString, '   to ', addressPath + fileName);

                resolve(true);
                return;

            });

            resolve(true);
            return;

        });

    }

    async encryptAddress(id) {

        console.info('Encrypt address.');

        let addressId = await this._chooseAddress(id);

        if (addressId < 0) {
            console.warn("You must enter a valid number.");
            return false;
        }

        let addressString = Blockchain.Wallet.addresses[addressId].address;
        let newPassword = await InterfaceBlockchainAddressHelper.askForPassword("Please enter a password(12 words separated by space):");
        let response = await Blockchain.Wallet.encryptAddress(addressString, newPassword);

        if (response === true)
            console.info("Address was encrypted:", addressString);
        else
            console.error("Address couldn't be encrypted:", addressString);

        return response.result;
    }

    async setMiningAddress(id) {

        console.info('Set mining address.');

        let addressId = await this._chooseAddress(id);

        if (addressId < 0) {
            console.warn("You must enter a valid number.");
            return false;
        }

        Blockchain.blockchain.mining.minerAddress = Blockchain.Wallet.addresses[addressId].address;

        return true;
    }

    async startMining(instantly) {


        await this._callCallbackBlockchainSync(undefined, () => Blockchain.MinerPoolManagement.minerPoolSettings.setMinerPoolActivated(false), async () => {

            if (instantly)
                await Blockchain.startMiningInstantly();
            else
                Blockchain.startMiningNextTimeSynchronized = true;

        }, undefined, undefined);

    }

    async startMiningInsidePool(url, isInteractive = true) {

        Log.info('Mining inside a POOL', Log.LOG_TYPE.POOLS);

        consts.SETTINGS.NODE.PORT = consts.SETTINGS.NODE.MINER_POOL_PORT;

        await this._callCallbackBlockchainSync(undefined, async () => {

            try {

                let getNewLink = true;

                if (typeof Blockchain.MinerPoolManagement.minerPoolSettings.poolURL === "string" && Blockchain.MinerPoolManagement.minerPoolSettings.poolURL !== '' && isInteractive) {

                    Log.info('Your current mining pool is: ' + Blockchain.MinerPoolManagement.minerPoolSettings.poolName + " " + Blockchain.MinerPoolManagement.minerPoolSettings.poolWebsite, Log.LOG_TYPE.error);
                    let response = await AdvancedMessages.confirm('Do you want to continue mining in the same pool: ' + Blockchain.MinerPoolManagement.minerPoolSettings.poolURL);

                    if (response === true) getNewLink = false;
                }

                let miningPoolLink = undefined;

                if (getNewLink) {

                    miningPoolLink = !!url ? url : await AdvancedMessages.input('Pool URLs should look like:\n  https://webdollar.io/pool/1/1/MyPoolName/<pool public key>/https:$$mybigpool.com\nEnter the new mining pool link: ');
                    Log.info('Your new MiningPool is : ' + miningPoolLink, Log.LOG_TYPE.info);

                }

                StatusEvents.on("miner-pool/connection-established", (data) => {
                    if (data.connected)
                        Blockchain.Mining.startMining();
                    else
                        Blockchain.Mining.stopMining();
                });

                Blockchain.MinerPoolManagement.startMinerPool(miningPoolLink, true);

            } catch (exception) {

                Log.error("There is a problem starting to mine in this pool", Log.LOG_TYPE.POOLS, exception);

            }

        }, undefined, undefined, false);

    }

    async createMiningPool() {

        Log.info('Create Mining Pool', Log.LOG_TYPE.info);

        await this._callCallbackBlockchainSync(async () => {

            try {

                await Blockchain.PoolManagement.setPoolStarted(false);

                let getNewLink = true;

                Log.warn('To be accessible by Browser miners you need an authorized SSL certificate and a free domain.', Log.LOG_TYPE.info);

                if (typeof Blockchain.PoolManagement.poolSettings.poolURL === "string" && Blockchain.PoolManagement.poolSettings.poolURL !== '') {

                    console.info('You have some settings for a pool: ', Blockchain.PoolManagement.poolSettings.poolName, " ", Blockchain.PoolManagement.poolSettings.poolWebsite);
                    let response = await AdvancedMessages.confirm('Do you want to continue using the settings for : ' + Blockchain.PoolManagement.poolSettings.poolURL);

                    if (response === true) getNewLink = false;
                }

                if (getNewLink) {

                    let poolFee, poolReferralFee, poolName, poolWebsite, poolServers;


                    poolFee = await AdvancedMessages.readNumber('Choose a fee(0...100): ', true);

                    if (isNaN(poolFee) || poolFee < 0 || 100 < poolFee) {
                        Log.error("You have entered an invalid number: " + poolFee, Log.LOG_TYPE.POOLS);
                        return false;
                    } else
                        Log.info("Your fee is " + poolFee, Log.LOG_TYPE.POOLS);

                    poolName = await AdvancedMessages.input('Pool Name: ');
                    poolWebsite = await AdvancedMessages.input('Pool Website: ');

                    poolReferralFee = await AdvancedMessages.readNumber("Choose a Referral fee (0...100): ", true);
                    if (isNaN(poolReferralFee) || poolReferralFee < 0 || 100 < poolReferralFee) {
                        Log.error("You have entered an invalid number:" + poolReferralFee, Log.LOG_TYPE.POOLS);
                        return false;
                    } else
                        Log.warn("Your Referral fee is: " + poolReferralFee, Log.LOG_TYPE.POOLS);

                    let response = await AdvancedMessages.confirm('Do you want to use external pool servers?: ');

                    if (response)
                        poolServers = await AdvancedMessages.input('Pool Servers (separated by comma): ');
                    else
                        poolServers = await NodeServer.getServerHTTPAddress(true);

                    console.info("Pool Servers:", poolServers);

                    if (response) {
                        await Blockchain.PoolManagement.poolSettings.setPoolUsePoolServers(true);
                    } else {
                        await Blockchain.PoolManagement.poolSettings.setPoolUsePoolServers(false);
                        await Blockchain.PoolManagement.poolSettings.setPoolUseSignatures(false);
                    }


                    if (poolFee) await Blockchain.PoolManagement.poolSettings.setPoolFee(poolFee / 100);
                    if (poolName) await Blockchain.PoolManagement.poolSettings.setPoolName(poolName);
                    if (poolWebsite) await Blockchain.PoolManagement.poolSettings.setPoolWebsite(poolWebsite);
                    if (poolServers) await Blockchain.PoolManagement.poolSettings.setPoolServers(poolServers);
                    if (poolReferralFee) await Blockchain.PoolManagement.poolSettings.setPoolReferralFee(poolReferralFee / 100);

                }

            } catch (exception) {

                Log.error("Error starting your pool", Log.LOG_TYPE.POOLS, exception);

            }

        }, async () => {

            await Blockchain.PoolManagement.startPool(true);

        }, undefined, undefined, true);

    }

    async createServerForMiningPool() {

        await this._callCallbackBlockchainSync(async () => {

                console.info('Create Server Pool');
                console.warn('To be accessible by Browser miners you need an authorized SSL certificate and a free domain.');

                let serverPoolFee = await AdvancedMessages.readNumber('Choose a fee(0...100): ', true);

                if (isNaN(serverPoolFee) || serverPoolFee < 0 || 100 < serverPoolFee) {
                    console.log("You have entered an invalid number:", serverPoolFee);
                    return false;
                } else
                    console.log("your fee is", serverPoolFee);

                await Blockchain.ServerPoolManagement.serverPoolSettings.setServerPoolFee(serverPoolFee / 100);

            },
            async () => {

                await Blockchain.ServerPoolManagement.startServerPool();

            }, undefined, undefined, true,
        );


    }

    async _callCallbackBlockchainSync(callbackBeforeBlockchainLoaded, callbackBeforeServerInitialization, callbackAfterServerInitialization, afterSynchronizationCallback, synchronize = true) {

        if (!Blockchain._blockchainInitiated) {

            await Blockchain.createBlockchain("full-node", callbackBeforeBlockchainLoaded, async () => {

                if (callbackBeforeServerInitialization) await callbackBeforeServerInitialization();

                await Node.NodeServer.startServer();

                await Node.NodeClientsService.startService();

                if (callbackAfterServerInitialization) await callbackAfterServerInitialization();

            }, afterSynchronizationCallback, synchronize);

        } else {

            if (callbackBeforeBlockchainLoaded) await callbackBeforeBlockchainLoaded();

            if (callbackBeforeServerInitialization) await callbackBeforeServerInitialization();

            if (callbackAfterServerInitialization) await callbackAfterServerInitialization();

            if (afterSynchronizationCallback) await afterSynchronizationCallback();

        }

    }


    disableForksImmutability() {

        consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH += 10000;

        setTimeout(() => {

            consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH -= 10000;

        }, 10 * 60 * 1000);

    }

    disconnectFromAllConnectedNodes() {

        let NodesList = require('node/lists/Nodes-List').default;
        NodesList.disconnectAllNodes(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET);

    }

    disconnectAllMinersNodes() {

        let NodesList = require('node/lists/Nodes-List').default;
        NodesList.disconnectAllNodesByConsensusType(NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL);

    }

    async setIntervalDisconnectAllMinersNodes(interval) {

        let intervalTime = !!interval || interval === 0 ? interval : await AdvancedMessages.readNumber('Enter the interval time: \n 0 - disable interval \n x - minutes');

        if (this._intervalDisconnectingMiners)
            clearTimeout(this._intervalDisconnectingMiners);

        if (intervalTime > 0) {

            this._intervalDisconnectingMiners = setInterval(() => {
                this.disconnectAllMinersNodes();
            }, intervalTime * 60 * 1000);

        }

    }

    /**
     * Asynchronously starts decrypting the active wallet.
     * @param password - the 12 word array of strings
     */
    decryptWallet(password) {
        return Blockchain.Mining.setPrivateKeyAddressForMiningAddress(password)
            .then(() => console.info('Done unlocking password protected wallet.'))
            .catch(err => console.error(`Failed to unlock password protected wallet. ${err}`));
    }

    /**
     * Read the password from a file and then decrypt the active wallet with it.
     * @param filename
     */
    decryptWalletFromFile(filename) {
        console.warn(`Reading password from ${filename}`)
        const password = FileSystem.readFileSync(filename, 'utf8');
        return this.decryptWallet(password.trim().split(' '));
    }

    showCommands() {

        console.info('\nChoose one of the following commands:');

        console.info("\nflagged arguments (example: -l, --list-addresses) can only be used in non-interactive mode.\nUse numbers for interactive mode.\n")
        for (let i = 0; i < commands.length; ++i) {
            console.info(commands[i]);
        }
        console.log();

        return true;
    }

}

const commands = [
    '1. List addresses (-l --list-addresses)',
    '2. Create new address (--create-address)',
    '3. Delete address (--delete-address {position in wallet list})',
    '4. Import address (--import-address {path to wallet})',
    '5. Export address (--export-address {position in wallet list})',
    '6. Encrypt address (--encrypt-address {position in wallet list})',
    '7. Set mining address (--mining-address {position in wallet list})',
    '8. Solo: Start Mining (--mine)',
    '9. Solo: Start Mining Instantly Even Unsynchronized (--mine-now)',
    '10. Mining Pool: Start Mining (--mine-in-pool {pool url})',
    '11. Mining Pool: Create a New Pool',
    '11-1. Mining Pool: Process Remaining Payment',
    '12. Server for Mining Pool: Create a new Server for Mining Pool (Optional and Advanced)',
    '13. Create Offline Transaction',
    '20. HTTPS Express Start',
    '21. Disable Node Immutability',
    '22. Disconnect from all consensus nodes',
    '23. Disconnect all miner nodes',
    '24. Set Interval to disconnect all miner nodes',
    '30. Set Password for Mining Address (--set-password \'{quoted password}\', --set-password-file {path to password.txt}',
    '53. Add address to banlist',
    '54. Load address banlist',
    '55. Save address banlist',
];

const lineSeparator =
    "\n|_______|____________________________________________|_________________|";

const addressHeader =
    "\n ______________________________________________________________________" +
    "\n|  NUM  |                  ADDRESS                   |      WEBD       |" +
    lineSeparator;

export default CLICore;
