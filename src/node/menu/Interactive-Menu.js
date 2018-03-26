import {Node, Blockchain} from '../../index.js';
const FileSystem = require('fs');
const readline = require('readline');

const commands = [
        '1. List addresses',
        '2. Export address',
        '3. Import address',
        '4. Delete address',
        '5. Set mining address'
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

_showCommands();
WEBD_CLI.prompt();

let runMenu = async function () {
    WEBD_CLI.question('Command: ', async (answer) => {
        switch(answer.trim()) {
            case '1':
                listAddresses();
                break;
            case '2':
                exportAddress();
                break;
            case '3':
                await importAddress();
                break;
            case '4':
                deleteAddress();
                break;
            case '5':
                setMiningAddress();
                break;
            case 'exit':
                break;
            default:
                _showCommands();
                break;
        }
        WEBD_CLI.setPrompt('WEBD_CLI:> ');
        WEBD_CLI.prompt();
        await runMenu();
    });
};

runMenu();

function _chooseAddress() {
    
    return new Promise(resolve => {
        
        this.listAddresses();
        
        WEBD_CLI.question('Choose the address number: ', (answer) => {
            
            console.log("You choosed " + answer);
            resolve(1);
        });
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

function listAddresses() {
    console.log('\nWallet addresses:');
    
    //Blockchain.Wallet.createNewAddress();
    
    console.log(addressHeader);
    for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {
        let address = Blockchain.Wallet.addresses[i].address;
        let balance = 1000000000.3354;//Blockchain.accountantTree.getBalance(address, undefined);
        
        if (0 /*is the mining address*/) {
            console.log("|  *" + i + "   |  " + address + "  | " + balance + lineSeparator);
        } else {
            console.log("|   " + i + "   |  " + address + "  | " + balance + lineSeparator);
        }
    }

    return true;
}

function exportAddress() {
    console.log('Export address.');
    
    /*WEBD_CLI.setPrompt("Enter address:");

    WEBD_CLI.on('line', (line) => {
        console.log("your address is" + line);
    });*/

    return true;
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

function deleteAddress() {
    console.log('Delete address.');


    return true;
}

function setMiningAddress() {
    console.log('Set mining address:');
    
    return true;
}