import {Node, Blockchain} from '../../index.js';
const FileSystem = require('fs');
const readline = require('readline');
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";

class CLI{

    constructor(){

        if (process.env.BROWSER)
            return;

        this.WEBD_CLI = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'WEBD_CLI:> '
        });

        this._exitMenu = undefined;

        this._start();

    }

    async _runMenu() {

        if (this._exitMenu === true) {
            this.WEBD_CLI.close();
            return;
        }

        let answer = await this.question('Command: ');

        switch(answer.trim()) {
            case '1':
                await this.listAddresses();
                break;
            case '2':
                await this.createNewAddress();
                break;
            case '3':
                await this.deleteAddress();
                break;
            case '4':
                await this.importAddress();
                break;
            case '5':
                await this.exportAddress();
                break;
            case '6':
                await this.encryptAddress();
                break;
            case '7':
                await this.setMiningAddress();
                break;
            case '8':
                await this.startMining();
                break;
            case '9':
                await this.startMining(true);
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

        await Blockchain.loadWallet();

        this._showCommands();
        this.WEBD_CLI.prompt();

        this._exitMenu = false;
        this._runMenu();
    }

    async _chooseAddress() {

        await this.listAddresses();

        let answer = await this.question('Choose the address number: ');

        let addressId = parseInt(answer);
        if (addressId === NaN || addressId < 0 || Blockchain.Wallet.addresses.length < addressId)
            addressId = -1;

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

    _sync(sync = true) {

        /*let callback = () => {

                Blockchain.startMiningNextTimeSynchronized = true;
        };

        if (!Blockchain._blockchainInitiated) {
            Blockchain.createBlockchain("full-node", () => {
                Node.NodeClientsService.startService();

                callback();
            });
        } else {
            callback();
        }*/
    }

    async listAddresses() {

        console.info('\nWallet addresses:');

        this._sync();

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
            balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);
        }
        console.log( "| MINING|  " + miningAddress + "  | " + balance + lineSeparator);

        this._sync(false);

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

            let addressPath = await this.question('Enter address path: ');

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

            let addressPath = await this.question('Enter path for saving address: ');

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

        let callback = () => {

            if (instantly)
                Blockchain.startMiningInstantly();
            else
                Blockchain.startMiningNextTimeSynchronized = true;

        };

        if (!Blockchain._blockchainInitiated) {
            Blockchain.createBlockchain("full-node", () => {
                Node.NodeServer.startServer();
                Node.NodeClientsService.startService();

                callback();
            });
        } else {
            callback();
        }

    }

    question(message){

        return new Promise ((resolve)=> {
            this.WEBD_CLI.question(message, (answer)=>{
                resolve(answer);
            });
        });

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
        '8. Start Mining',
        '9. Start Mining Genesis Instantly',
    ];

const lineSeparator =
    "\n|_______|____________________________________________|_________________|";

const addressHeader =
    "\n ______________________________________________________________________" +
    "\n|  NUM  |                  ADDRESS                   |      WEBD       |" +
    lineSeparator;



export default new CLI();