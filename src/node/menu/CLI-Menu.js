/* eslint-disable */
import CONNECTION_TYPE from "../lists/types/Connection-Type";

const FileSystem = require('fs');
import {JsonRpcServer} from './../jsonRpc';

let NodeExpress, NodeServer;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}


import consts from 'consts/const_global';
import {Node} from '../../index.js';
import AdvancedMessages from './Advanced-Messages';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import Blockchain from "main-blockchain/Blockchain"
import StatusEvents from "common/events/Status-Events";
import NodeServer from 'node/sockets/node-server/sockets/Node-Server';
import Log from 'common/utils/logging/Log';
import PoolRewardsManagement from "common/mining-pools/pool/pool-management/pool-work/rewards/Payout/Pool-Process-Remaining-Payment"

class CLI {

    constructor(){

        if (process.env.BROWSER)
            return;

        this._exitMenu = undefined;

        this._start();

    }

    async _runMenu() {

        if (this._exitMenu === true) {
            AdvancedMessages.WEBD_CLI.close();
            process.exit();
            return;
        }

        let answer = await AdvancedMessages.input('Command: ');

        switch(answer.trim()) {
            case '1': //  List addresses'
                await this.listAddresses();
                break;
            case '2': //  Create new address',
                await this.createNewAddress();
                break;
            case '3': //  Delete Address
                await this.deleteAddress();
                break;
            case '4': //  Import Address
                await this.importAddress();
                break;
            case '5': //  Export Address
                await this.exportAddress();
                break;
            case '6': //  Encrypt Address
                await this.encryptAddress();
                break;
            case '7': //  Set Mining Address
                await this.setMiningAddress();
                break;
            case '8': //  Start Mining
                await this.startMining();
                break;
            case '9': //  Start Mining Instantly
                await this.startMining(true);
                break;
            case '10': // Mining Pool: Start Mining in a Pool
                await this.startMiningInsidePool();
                break;
            case '11-1':  // Mining Pool: Create a New Pool
                await this.processRemainingPayment();
                break;
            case '11':  // Mining Pool: Create a New Pool
                await this.createMiningPool();
                break;
            case '12':  // Server Mining Pool: Create a new Server for Mining Pool
                await this.createServerForMiningPool();
                break;
            case '13': //  Import Address
                await this.signTransaction();
                break;
            case '20':  // Server Mining Pool: Create a new Server for Mining Pool
                await NodeServer.startServer();
                break;
            case '21': // Disable Forks Immutability
                await this.disableForksImmutability();
                break;
            case '22': // Disable Forks Immutability
                await this.disconnectFromAllConnectedNodes();
                break;
            case '30':  // Set Password
                await Blockchain.Mining.setPrivateKeyAddressForMiningAddress();
                break;
            case 'exit':
                this._exitMenu = true;
                break;
            default:
                this._showCommands();
                break;
        }

        await this._runMenu();
    };

    signTransaction(){

        console.info('Sign Transaction');

        return new Promise( async (resolve) => {

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

            if ( wantToPropagate.toUpperCase().trim() === 'Y' ? true : false)
                wantToPropagate = true;
            else
                wantToPropagate = false;

            let feeToSend = Blockchain.Transactions.wizard.calculateFeeSimple ( amountToSend );

            let addressString = Blockchain.Wallet.addresses[addressId].address;
            let answer = null;

            //Trick for blocks length and address nonce
            Blockchain.blockchain.blocks.length = timelock+1;

            for(let i=0; i<Blockchain.Wallet.addresses.length; i++)
                if(addressString === Blockchain.Wallet.addresses[i].address)
                    answer = await Blockchain.Transactions.wizard.validateTransaction( Blockchain.Wallet.addresses[i].address, toAddress, amountToSend*WebDollarCoins.WEBD, feeToSend, undefined, undefined, timelock-1, nonce, true);

            let data ={};

            if (answer.result){

                data.transaction = answer.transaction.serializeTransaction();
                data.signature = answer.signature;

                if (wantToPropagate)
                    Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction( answer.transaction, undefined, true);

            }else{

                console.log("Transaction was not created. " + answer.message);
                resolve(false);
                return;

            }

            FileSystem.writeFile(addressPath+"transaction.tx", JSON.stringify(data), 'utf8', (err) => {

                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }

                console.log("Transaction successfully exported to ," + addressPath+"transaction.tx");

                resolve(true);

            });

            resolve(true);

        });

    }

    async _start() {

        Log.info('CLI menu started', Log.LOG_TYPE.CLI_MENU);

        if (Blockchain !== undefined)
            await Blockchain.loadWallet();

        this._showCommands();
        AdvancedMessages.WEBD_CLI.prompt();

        JsonRpcServer(consts.JSON_RPC);

        this._exitMenu = false;
        await this._runMenu();
    }

    async processRemainingPayment(){

        await this._callCallbackBlockchainSync( undefined, undefined, undefined, async ()=>{
            await Blockchain.PoolManagement.poolRemainingRewards.doPayout();
        }, true);

    }

    async _chooseAddress() {

        await this.listAddresses();

        let addressId = await AdvancedMessages.readNumber('Choose the address number: ');

        if (isNaN(addressId) || addressId < 0 || Blockchain.Wallet.addresses.length <= addressId)
            return -1;

        return addressId;
    }

    _showCommands() {

        console.info('\nChoose one of the following commands:');

        for (let i = 0; i < commands.length; ++i){
            console.info(commands[i]);
        }
        console.log();

        return true;
    }

    async listAddresses() {


        console.warn("INFO: YOU NEED TO BE SYNC TO SEE THE VALUE OF YOUR WALLET!!!");
        console.info('\nWallet addresses:');

        let miningAddress = Blockchain.blockchain.mining.minerAddress;
        if (miningAddress === undefined)
            miningAddress = 'not specified';

        console.log(addressHeader);
        for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {

            let address = Blockchain.Wallet.addresses[i].address;

            let balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);

            balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

            if (address === miningAddress)
                console.log(((i < 10) ? "|  *" : "| *") + i + "   |  " + address + "  | " + balance + lineSeparator);
            else
                console.log(((i < 10) ? "|   " : "|  ")+ i + "   |  " + address + "  | " + balance + lineSeparator);

        }

        let balance = 0;
        if (miningAddress !== 'not specified') {
            balance = Blockchain.blockchain.accountantTree.getBalance(miningAddress, undefined);
            balance = (balance === null) ? 0 : balance;

            if (Blockchain.MinerPoolManagement !== undefined && Blockchain.MinerPoolManagement.minerPoolStarted)
                balance += Blockchain.MinerPoolManagement.minerPoolReward.total;

            balance /= WebDollarCoins.WEBD;


        }
        console.log( "| MINING|  " + miningAddress + "  | " + balance + lineSeparator);

        return true;

    }

    async createNewAddress() {

        console.info('Create new address.');
        try {
            let address = await Blockchain.Wallet.createNewAddress();
            console.info("Address was created: " + address.address);
            return true;
        } catch(err) {
            console.err(err);
            return false;
        }

    }

    async deleteAddress() {

        console.info('Delete address.');

        let addressId = await this._chooseAddress();

        if (addressId < 0) {
            console.warn("You must enter a valid number.");
            return false;
        }

        let response = await Blockchain.Wallet.deleteAddress(Blockchain.Wallet.addresses[addressId].address);

        return response.result;
    }

    importAddress() {

        console.info('Import address.');

        return new Promise( async (resolve) => {

            let addressPath = await AdvancedMessages.input('Enter address path: ');

            FileSystem.readFile(addressPath, 'utf8', async (err, content) => {

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

                        if(Blockchain.Wallet.addresses.length===1) Blockchain.blockchain.mining.minerAddress = Blockchain.Wallet.addresses[0].address;

                        resolve(true);
                    } else {
                        console.error(answer.message);
                        resolve(false);
                    }

                } catch(err) {
                    console.error(err.message);
                    resolve(false);
                }


            });

        });

    }

    exportAddress() {

        console.info('Export address.');

        return new Promise( async (resolve) => {

            let addressId = await this._chooseAddress();

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

            FileSystem.writeFile(addressPath+fileName, jsonAddress, 'utf8', (err) => {

                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }

                console.log("Address successfully exported", addressString, '   to ', addressPath+fileName);

                resolve(true);
                return;

            });

            resolve(true);
            return;

        });

    }

    async encryptAddress() {

        console.info('Encrypt address.');

        let addressId = await this._chooseAddress();

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

    async setMiningAddress() {

        console.info('Set mining address.');

        let addressId = await this._chooseAddress();

        if (addressId < 0) {
            console.warn("You must enter a valid number.");
            return false;
        }

        Blockchain.blockchain.mining.minerAddress = Blockchain.Wallet.addresses[addressId].address;

        return true;
    }

    async startMining(instantly){



        await this._callCallbackBlockchainSync( undefined, async ()=>{

            await Blockchain.MinerPoolManagement.minerPoolSettings.setMinerPoolActivated(false);

        }, async ()=>{

            if (instantly)
                await Blockchain.startMiningInstantly();
            else
                Blockchain.startMiningNextTimeSynchronized = true;

        }, undefined, undefined );

    }

    async startMiningInsidePool(){

        Log.info('Mining inside a POOL', Log.LOG_TYPE.POOLS);

        consts.SETTINGS.NODE.PORT = consts.SETTINGS.NODE.MINER_POOL_PORT;

        await this._callCallbackBlockchainSync(undefined, async ()=>{

            try {

                let getNewLink = true;

                if (typeof Blockchain.MinerPoolManagement.minerPoolSettings.poolURL === "string" && Blockchain.MinerPoolManagement.minerPoolSettings.poolURL !== '') {

                    Log.info('Your current mining pool is: ' + Blockchain.MinerPoolManagement.minerPoolSettings.poolName +" " +Blockchain.MinerPoolManagement.minerPoolSettings.poolWebsite, Log.LOG_TYPE.error);
                    let response = await AdvancedMessages.confirm('Do you want to continue mining in the same pool: ' + Blockchain.MinerPoolManagement.minerPoolSettings.poolURL);

                    if (response === true) getNewLink = false;

                }

                let miningPoolLink = undefined;

                if (getNewLink) {

                    miningPoolLink = await AdvancedMessages.input('Enter the new mining pool link: ');
                    Log.info('Your new MiningPool is : ' + miningPoolLink, Log.LOG_TYPE.info);

                }

                StatusEvents.on("miner-pool/connection-established", (data) => {
                    if (data.connected)
                        Blockchain.Mining.startMining();
                    else
                        Blockchain.Mining.stopMining();
                });

                Blockchain.MinerPoolManagement.startMinerPool(miningPoolLink, true);

            } catch (exception){

                Log.error("There is a problem starting to mine in this pool", Log.LOG_TYPE.POOLS, exception);

            }

        }, undefined, undefined, false);

    }

    async createMiningPool(){

        Log.info('Create Mining Pool', Log.LOG_TYPE.info );

        await this._callCallbackBlockchainSync( async ()=>{

            try{

                await Blockchain.PoolManagement.setPoolStarted(false);

                let getNewLink = true;

                Log.warn('To be accessible by Browser miners you need an authorized SSL certificate and a free domain.', Log.LOG_TYPE.info);

                if (typeof Blockchain.PoolManagement.poolSettings.poolURL === "string" && Blockchain.PoolManagement.poolSettings.poolURL !== ''){

                    console.info('You have some settings for a pool: ', Blockchain.PoolManagement.poolSettings.poolName," ", Blockchain.PoolManagement.poolSettings.poolWebsite );
                    let response = await AdvancedMessages.confirm('Do you want to continue using the settings for : '+Blockchain.PoolManagement.poolSettings.poolURL);

                    if (response === true) getNewLink = false;
                }

                if (getNewLink){

                    let poolFee, poolReferralFee, poolName, poolWebsite, poolServers;


                    poolFee = await AdvancedMessages.readNumber('Choose a fee(0...100): ', true);

                    if (isNaN(poolFee) || poolFee < 0 || 100 < poolFee){
                        Log.error("You have entered an invalid number: " + poolFee, Log.LOG_TYPE.POOLS);
                        return false;
                    }
                    else
                        Log.info("Your fee is "+poolFee, Log.LOG_TYPE.POOLS);

                    poolName = await AdvancedMessages.input('Pool Name: ');
                    poolWebsite = await AdvancedMessages.input('Pool Website: ');

                    poolReferralFee = await AdvancedMessages.readNumber("Choose a Referral fee (0...100): ", true);
                    if (isNaN(poolReferralFee) || poolReferralFee < 0 || 100 < poolReferralFee){
                        Log.error("You have entered an invalid number:" + poolReferralFee, Log.LOG_TYPE.POOLS);
                        return false;
                    }
                    else
                        Log.warn("Your Referral fee is: " + poolReferralFee, Log.LOG_TYPE.POOLS );

                    let response = await AdvancedMessages.confirm('Do you want to use external pool servers?: ');

                    if (response)
                        poolServers = await AdvancedMessages.input('Pool Servers (separated by comma): ');
                    else
                        poolServers = await NodeServer.getServerHTTPAddress(true);

                    console.info("Pool Servers:", poolServers);

                    if (response){
                        await Blockchain.PoolManagement.poolSettings.setPoolUsePoolServers( true ) ;
                    } else {
                        await Blockchain.PoolManagement.poolSettings.setPoolUsePoolServers( false ) ;
                        await Blockchain.PoolManagement.poolSettings.setPoolUseSignatures( false ) ;
                    }


                    if (poolFee ) await Blockchain.PoolManagement.poolSettings.setPoolFee(poolFee / 100);
                    if (poolName ) await Blockchain.PoolManagement.poolSettings.setPoolName(poolName);
                    if (poolWebsite ) await Blockchain.PoolManagement.poolSettings.setPoolWebsite(poolWebsite);
                    if (poolServers ) await Blockchain.PoolManagement.poolSettings.setPoolServers(poolServers);
                    if (poolReferralFee ) await Blockchain.PoolManagement.poolSettings.setPoolReferralFee(poolReferralFee / 100);

                }

            } catch (exception){

                Log.error("Error starting your pool", Log.LOG_TYPE.POOLS, exception);

            }

        }, async ()=>{

            await Blockchain.PoolManagement.startPool(true);

        }, undefined, undefined, true);

    }

    async createServerForMiningPool(){

        await this._callCallbackBlockchainSync( async ()=> {

                console.info('Create Server Pool');
                console.warn('To be accessible by Browser miners you need an authorized SSL certificate and a free domain.');

                let serverPoolFee = await AdvancedMessages.readNumber('Choose a fee(0...100): ', true);

                if (isNaN(serverPoolFee) || serverPoolFee < 0 || 100 < serverPoolFee){
                    console.log("You have entered an invalid number:", serverPoolFee);
                    return false;
                }
                else
                    console.log("your fee is", serverPoolFee );

                await Blockchain.ServerPoolManagement.serverPoolSettings.setServerPoolFee(serverPoolFee / 100);

            },
            async ()=>{

                await Blockchain.ServerPoolManagement.startServerPool();

            }, undefined, undefined, true,

        );


    }

    async _callCallbackBlockchainSync(callbackBeforeBlockchainLoaded, callbackBeforeServerInitialization, callbackAfterServerInitialization, afterSynchronizationCallback, synchronize=true ){

        if (!Blockchain._blockchainInitiated) {

            await Blockchain.createBlockchain("full-node", callbackBeforeBlockchainLoaded, async () => {

                if (typeof callbackBeforeServerInitialization === "function")
                    await callbackBeforeServerInitialization();

                await Node.NodeServer.startServer();

                await Node.NodeClientsService.startService();

                if (typeof callbackAfterServerInitialization === "function")
                    await callbackAfterServerInitialization();

            }, afterSynchronizationCallback, synchronize );

        } else {

            if (typeof callbackBeforeBlockchainLoaded === "function")
                await callbackBeforeBlockchainLoaded();

            if (typeof callbackBeforeServerInitialization === "function")
                await callbackBeforeServerInitialization();

            if (typeof callbackAfterServerInitialization === "function")
                await callbackAfterServerInitialization();

            if (typeof afterSynchronizationCallback === "function")
                await afterSynchronizationCallback();

        }

    }


    disableForksImmutability(){

        consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH += 10000;

        setTimeout( ()=>{

            consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH -= 10000;

        }, 10*60*1000);

    }

    disconnectFromAllConnectedNodes(){

        let NodesList = require('node/lists/Nodes-List').default;
        NodesList.disconnectAllNodes(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET);

    }

}

const commands = [
        '1. List addresses',
        '2. Create new address',
        '3. Delete address',
        '4. Import address',
        '5. Export address',
        '6. Encrypt address',
        '7. Set mining address',
        '8. Solo: Start Mining',
        '9. Solo: Start Mining Instantly Even Unsynchronized',
        '10. Mining Pool: Start Mining',
        '11. Mining Pool: Create a New Pool',
        '11-1. Mining Pool: Process Remaining Payment',
        '12. Server for Mining Pool: Create a new Server for Mining Pool (Optional and Advanced)',
        '13. Create Offline Transaction',
        '20. HTTPS Express Start',
        '21. Disable Node Immutability',
        '22. Disconnect from all nodes',
        '30. Set Password for Mining Address',
    ];


const lineSeparator =
    "\n|_______|____________________________________________|_________________|";

const addressHeader =
    "\n ______________________________________________________________________" +
    "\n|  NUM  |                  ADDRESS                   |      WEBD       |" +
    lineSeparator;



export default new CLI();
