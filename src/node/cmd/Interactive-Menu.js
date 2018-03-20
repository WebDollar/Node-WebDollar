import {Node, Blockchain} from '../../index.js';
import global from "consts/global.js";

const readline = require('readline');

const commands = [
        '1. List addresses',
        '2. Export address',
        '3. Import address',
        '4. Set mining address'
    ];

const RL = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'WEBD_CLI:> '
});

showCommands();
RL.prompt();

RL.on('line', (line) => {

    switch(line.trim()) {
        case '1':
            listAddresses();
        break;
        case '2':
            exportAddress();
        break;
        case '3':
            importAddress();
        break;
        case '4':
            setMiningAddress();
        break;
        default:
            showCommands();
        break;
    }
    RL.prompt();
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
    console.log('List addresses:');
    Blockchain.Wallet.createNewAddress();
    for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {
        console.log(i + ": " + Blockchain.Wallet.addresses[i].toString());
    }

    return true;
}

function exportAddress() {
    console.log('Export address:');
    
    return true;
}

function importAddress() {
    console.log('Import address:');
    
    return true;
}

function setMiningAddress() {
    console.log('Set mining address:');
    
    return true;
}