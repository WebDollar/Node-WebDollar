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
    "\n|________________________________________________________________|_________________|";

const addressHeader = 
    "\n __________________________________________________________________________________" +
    "\n|                            ADDRESS                             |      WEBD       |" +
    lineSeparator;

const WEBD_CLI = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'WEBD_CLI:> '
});

showCommands();
WEBD_CLI.prompt();

let runMenu = function () {
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
                showCommands();
                break;
        }
        WEBD_CLI.setPrompt('WEBD_CLI:> ');
        WEBD_CLI.prompt();
        runMenu();
    });
};

runMenu();

function showCommands() {
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

        console.log("|  " + address + "  | " + balance + lineSeparator);
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

async function importAddress() {
    console.log('Import address.');

    let addressPath = "D:\\WEBD$gBugUC6mM2rPLpHRKsALKqwaHgCjj%y&U$#4@MfVT6Vk%W3gSbsPw==.webd";

    /*await WEBD_CLI.question('Enter address path: ', async (answer) => {
        addressPath = answer;
    });*/

    FileSystem.readFile(addressPath, 'utf8', async function(err, content) {

        if (err) {
            console.error(err);
            return false;
        }

        try {
            let answer = await Blockchain.Wallet.importAddressFromJSON(JSON.parse(content));

            if (answer.result === true) {
                console.log("Address Imported", answer.address);
            } else {
                console.error(answer.message);
                return false;
            }
        } catch(err) {
            console.log(err.message);
            return false;
        }

        return true;
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