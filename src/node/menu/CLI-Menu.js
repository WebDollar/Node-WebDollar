const FileSystem = require('fs');

import consts from 'consts/const_global';
import {Node} from '../../index.js';
import AdvancedMessages from './Advanced-Messages';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import Blockchain from "main-blockchain/Blockchain"
import StatusEvents from "common/events/Status-Events";
import NodeServer from 'node/sockets/node-server/sockets/Node-Server';

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
            case '11':  // Mining Pool: Create a New Pool
                await this.createMiningPool();
                break;
            case '12':  // Server Mining Pool: Create a new Server for Mining Pool
                await this.createServerForMiningPool();
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

    async _start() {

        if (Blockchain !== undefined)
            await Blockchain.loadWallet();

        this._showCommands();
        AdvancedMessages.WEBD_CLI.prompt();

        this._exitMenu = false;
        await this._runMenu();
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


        await this._callCallbackBlockchainSync(async ()=>{

            console.info('\nWallet addresses:');

            let miningAddress = Blockchain.blockchain.mining.minerAddress;
            if (miningAddress === undefined)
                miningAddress = 'not specified';

            console.log(addressHeader);
            for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {

                let address = Blockchain.Wallet.addresses[i].address;

                let balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);

                balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

                if (address === miningAddress) {
                    console.log(((i < 10) ? "|  *" : "| *") + i + "   |  " + address + "  | " + balance + lineSeparator);
                } else {
                    console.log(((i < 10) ? "|   " : "|  ")+ i + "   |  " + address + "  | " + balance + lineSeparator);
                }
            }

            let balance = 0;
            if (miningAddress !== 'not specified') {
                balance = Blockchain.blockchain.accountantTree.getBalance(miningAddress, undefined);
                balance = (balance === null) ? 0 : balance;

                if (Blockchain.MinerPoolManagement.minerPoolStarted)
                    balance += Blockchain.MinerPoolManagement.minerPoolReward.confirmedReward + Blockchain.MinerPoolManagement.minerPoolReward.totalReward;

                balance /= WebDollarCoins.WEBD;


            }
            console.log( "| MINING|  " + miningAddress + "  | " + balance + lineSeparator);

            return true;

        }, true);
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

                console.log("Address successfully exported", addressString);
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

        await this._callCallbackBlockchainSync( async ()=>{

            await Blockchain.MinerPoolManagement.minerPoolSettings.setMinerPoolActivated(false);

        }, async ()=>{

            if (instantly)
                await Blockchain.startMiningInstantly();
            else
                Blockchain.startMiningNextTimeSynchronized = true;

        } );

    }

    async startMiningInsidePool(){
        
        console.info('Mining inside a POOL');

        await this._callCallbackBlockchainSync(async ()=>{

            let getNewLink = true;

            if (typeof Blockchain.MinerPoolManagement.minerPoolSettings.poolURL === "string" && Blockchain.MinerPoolManagement.minerPoolSettings.poolURL !== ''){

                console.info('Your current mining pool is: ', Blockchain.MinerPoolManagement.minerPoolSettings.poolName," ", Blockchain.MinerPoolManagement.minerPoolSettings.poolWebsite );
                let response = await AdvancedMessages.confirm('Do you want to continue mining in the same pool: '+Blockchain.MinerPoolManagement.minerPoolSettings.poolURL);

                if (response === true) getNewLink = false;

            }

            let miningPoolLink = undefined;

            if (getNewLink) {

                miningPoolLink = await AdvancedMessages.input('Enter the new mining pool link: ');
                console.info('Your new MiningPool is : ', miningPoolLink);

            }

            StatusEvents.on("miner-pool/connection-established",(data)=>{
                if (data.connected)
                    Blockchain.Mining.startMining();
                else
                    Blockchain.Mining.stopMining();
            });

             Blockchain.MinerPoolManagement.startMinerPool( miningPoolLink, true );

        }, false);

    }

    async createMiningPool(){

        console.info('Create Mining Pool');

        await this._callCallbackBlockchainSync(async ()=>{

            await Blockchain.PoolManagement.setPoolStarted(false);

            let getNewLink = true;

            console.warn('To be accessible by Browser miners you need an authorized SSL certificate and a free domain.');

            if (typeof Blockchain.PoolManagement.poolSettings.poolURL === "string" && Blockchain.PoolManagement.poolSettings.poolURL !== ''){

                console.info('You have some settings for a pool: ', Blockchain.PoolManagement.poolSettings.poolName," ", Blockchain.PoolManagement.poolSettings.poolWebsite );
                let response = await AdvancedMessages.confirm('Do you want to continue using the settings for : '+Blockchain.PoolManagement.poolSettings.poolURL);

                if (response === true) getNewLink = false;
            }

            if (getNewLink){

                let poolFee, poolName, poolWebsite, poolServers;


                poolFee = await AdvancedMessages.readNumber('Choose a fee(0...100): ', true);

                if (isNaN(poolFee) || poolFee < 0 || 100 < poolFee){
                    console.log("You have entered an invalid number:", poolFee);
                    return false;
                }
                else
                    console.log("Your fee is", poolFee);

                poolName = await AdvancedMessages.input('Pool Name: ');
                poolWebsite = await AdvancedMessages.input('Pool Website: ');

                let response = await AdvancedMessages.confirm('Do you want to use external pool servers?: ');

                if (response){
                    poolServers = await AdvancedMessages.input('Pool Servers (separated by comma): ');
                    await Blockchain.PoolManagement.poolSettings.setPoolUsePoolServers( true ) ;
                } else {
                    poolServers = await NodeServer.getServerHTTPAddress(true);
                    await Blockchain.PoolManagement.poolSettings.setPoolUsePoolServers( false ) ;
                }


                if (poolFee !== undefined) await Blockchain.PoolManagement.poolSettings.setPoolFee(poolFee / 100);
                if (poolName !== undefined) await Blockchain.PoolManagement.poolSettings.setPoolName(poolName);
                if (poolWebsite !== undefined) await Blockchain.PoolManagement.poolSettings.setPoolWebsite(poolWebsite);
                if (poolServers !== undefined) await Blockchain.PoolManagement.poolSettings.setPoolServers(poolServers);

            }

            Blockchain.PoolManagement.startPool(true);


        }, true);

    }

    async createServerForMiningPool(){

        console.info('Create Server Pool');
        console.warn('To be accessible by Browser miners you need an authorized SSL certificate and a free domain.');

        let serverPoolFee = await AdvancedMessages.readNumber('Choose a fee(0...100): ', true);

        if (isNaN(serverPoolFee) || serverPoolFee < 0 || 100 < serverPoolFee){
            console.log("You have entered an invalid number:", serverPoolFee);
            return false;
        }
        else
            console.log("your fee is", serverPoolFee );

        await this._callCallbackBlockchainSync(async ()=>{

            await Blockchain.ServerPoolManagement.serverPoolSettings.setServerPoolFee(serverPoolFee / 100);
            await Blockchain.ServerPoolManagement.startServerPool();

        }, true);


    }

    async _callCallbackBlockchainSync(callbackBeforeServerInitialization, callbackAfterServerInitialization, synchronize=true ){

        if (!Blockchain._blockchainInitiated) {

            await Blockchain.createBlockchain("full-node", async () => {

                await Node.NodeServer.startServer();

                if (typeof callbackBeforeServerInitialization === "function")
                    await callbackBeforeServerInitialization();

                await Node.NodeClientsService.startService();

                if (typeof callbackAfterServerInitialization === "function")
                    await callbackAfterServerInitialization();

            }, undefined, synchronize );
        } else {

            if (typeof callbackBeforeServerInitialization === "function")
                await callbackBeforeServerInitialization();

            if (typeof callbackAfterServerInitialization === "function")
                await callbackAfterServerInitialization();

        }

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
        '12. Server for Mining Pool: Create a new Server for Mining Pool',
    ];

const lineSeparator =
    "\n|_______|____________________________________________|_________________|";

const addressHeader =
    "\n ______________________________________________________________________" +
    "\n|  NUM  |                  ADDRESS                   |      WEBD       |" +
    lineSeparator;



export default new CLI();