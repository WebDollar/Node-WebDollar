import {Node, Blockchain} from '../../index.js';
const FileSystem = require('fs');
const readline = require('readline');

const commands = [
        '1. List addresses',
        '2. Create new address',
        '3. Delete address',
        '4. Import address',
        '5. Export address',
        '6. Set mining address',
    ];

const lineSeparator = 
    "\n|_______|________________________________________________________________|_________________|";

const addressHeader = 
    "\n __________________________________________________________________________________________" +
    "\n|  NUM  |                            ADDRESS                             |      WEBD       |" +
    lineSeparator;

const WEBD_CLI = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'WEBD_CLI:> '
});
let exitMenu;

let _runMenu = async function () {

    if (exitMenu === true) {
        return;
        WEBD_CLI.close();
    }

    WEBD_CLI.question('Command: ', async (answer) => {
        switch(answer.trim()) {
            case '1':
                await listAddresses();
                break;
            case '2':
                await createNewAddress();
                break;
            case '3':
                await deleteAddress();
                break;
            case '4':
                await importAddress();
                break;
            case '5':
                await exportAddress();
                break;
            case '6':
                await setMiningAddress();
                break;
            case 'exit':
                exitMenu = true;
                break;
            default:
                _showCommands();
                break;
        }

        await _runMenu();
    });
};

async function _start() {
    await Blockchain.Wallet.loadWallet();
    _showCommands();
    WEBD_CLI.prompt();
    exitMenu = false;
    _runMenu();
}

_start();

function _chooseAddress() {
    
    return new Promise(resolve => {
        
        listAddresses().then( () => {
            WEBD_CLI.question('Choose the address number: ', (answer) => {
                
                let addressId = parseInt(answer);
                if (addressId === NaN || addressId < 0 || Blockchain.Wallet.addresses.length < addressId)
                    addressId = -1;

                resolve(addressId);
            });
        }) ;

    });
}

function _showCommands() {
    console.log('\nChoose one of the following commands:');
    
    for (let i = 0; i < commands.length; ++i){
        console.log(commands[i]);
    }
    console.log();
    
    return true;
}

async function listAddresses() {
    console.log('\nWallet addresses:');

    let miningAddress = Blockchain.Wallet.getMiningAddress();

    console.log(addressHeader);
    for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {
        let address = Blockchain.Wallet.addresses[i].address;
        let balance = 1000000000.3354;//Blockchain.accountantTree.getBalance(address, undefined);
        
        if (address === miningAddress) {
            console.log(((i < 10) ? "|  *" : "| *") + i + "   |  " + address + "  | " + balance + lineSeparator);
        } else {
            console.log(((i < 10) ? "|   " : "|  ")+ i + "   |  " + address + "  | " + balance + lineSeparator);
        }
    }

    return true;
}

async function createNewAddress() {
    console.log('Create new address.');
    
    await Blockchain.Wallet.createNewAddress();
    
    return true;
}

async function deleteAddress() {
    console.log('Delete address.');

    let addressId = await _chooseAddress();
    
    if (addressId < 0) {
        console.log("You must enter a valid number.");
        return false;
    }

    let response = await Blockchain.Wallet.deleteAddress(Blockchain.Wallet.addresses[addressId].address);

    if (response.result === true) {
        console.log(response.message);
    } else {
        console.log(response.message);
    }
    
    return response.result;
}

function importAddress() {
    console.log('Import address.');

    return new Promise(resolve => {

        WEBD_CLI.question('Enter address path: ', (addressPath) => {
            
            FileSystem.readFile(addressPath, 'utf8', async function(err, content) {

                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }

                try {
                    let answer = await Blockchain.Wallet.importAddressFromJSON(JSON.parse(content));

                    if (answer.result === true) {
                        console.log("Address Imported", answer.address);
                        await Blockchain.Wallet.saveWallet();
                        resolve(true);
                        return;
                    } else {
                        console.error(answer.message);
                        resolve(false);
                        return;
                    }
                } catch(err) {
                    console.log(err.message);
                    resolve(false);
                    return;
                }

                resolve(false);
                return;
            });

        });

    });
    
}

async function exportAddress() {
    console.log('Export address.');
    
    let addressId = await _chooseAddress();
    
    if (addressId < 0) {
        console.log("You must enter a valid number.");
        return false;
    }
    
    return true;
}

async function setMiningAddress() {
    console.log('Set mining address.');
    
    let addressId = await _chooseAddress();
    
    if (addressId < 0) {
        console.log("You must enter a valid number.");
        return false;
    }
    
    return true;
}

export default WEBD_CLI;