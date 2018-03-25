import {Node, Blockchain} from '../../index.js';
import global from "consts/global.js";

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

WEBD_CLI.on('line', async (line) => {

    switch(line.trim()) {
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
        default:
            showCommands();
        break;
    }
    WEBD_CLI.setPrompt('WEBD_CLI:> ');
    WEBD_CLI.prompt();
}).on('close', () => {

    console.log('You have exited from WEBD CLI');
    process.exit(0);
});

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
    
    let path = "D:\\WEBD$gB_q&9NekdNWgjzaEx%QKKLuaPrm2JidqzCZ#GVP5scVsbx9EbsPw==.webd";
    let data = {"version":"0.1","address":"WEBD$gB*q&9NekdNWgjzaEx%QKKLuaPrm2JidqzCZ#GVP5scVsbx9EbsPw==","publicKey":"53dacac6760a83469f49ef9e91037d4ff9bbf684f4a914aa517a56bf1506011d","privateKey":"802542af7f7396f7bf016d920c4896e253d70d7417e77415e5729b277d09b1ee306025e24b"};
    await Blockchain.Wallet.importAddressFromPrivateKey(data);
    
    
    return true;
}

function deleteAddress() {
    console.log('Delete address.');


    return true;
}

function setMiningAddress() {
    console.log('Set mining address:');
    
    return true;
}