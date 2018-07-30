const Commands = require('./with/commands.js');

const commands = new Commands();

/**
 * EXPRESS SERVER
 */

// Server
commands.add({
    name: 'server:domain',
    help: 'Sets the domain of your express server',
    default: 'localhost',
});

commands.add({
    name: 'server:port',
    help: 'Sets the port of your express server',
    default: 443,
});

/**
 * MAX CONNECTIONS
 */

// Max
commands.add({
    name: 'max:browser',
    help: 'Sets maximum connections from browser',
    default: 1000,
});

commands.add({
    name: 'max:terminal',
    help: 'Sets maximum connections from terminal',
    default: 400,
});

commands.add({
    name: 'max:workers',
    help: 'Sets the number of workers\n\
        Notes: \n\
        using -1 will disable them\n\
        using 0 will create cpus/2 workers',
    default: -1,
});

/**
 * MINER ADDRESS
 */

// Miner
commands.add({
    name: 'miner:address',
    help: 'Sets the mining address\n\
        Notes:\n\
        if not specified it uses the first address from database\n\
        if no address in database, it creates a new one and uses it\n\
        Example:\n\
        miner:address=\'value\' (wrap the value in single quotes)',
    default: false,
});

commands.add({
    name: 'miner:pool',
    help: 'Sets mining pool url\n\
        Example:\n\
        miner:address=\'value\' (wrap the value in single quotes)',
    default: false,
});

commands.add({
    name: 'miner:run',
    help: 'Starts mining',
    options: ['single', 'pool'],
});

commands.add({
    name: 'miner:type',
    help: 'Selecting Mining Type',
    options: ['cpu', 'cpu-cpp', "gpu"],
    default: 'cpu',
});

commands.add({
    name: 'miner:threads',
    help: 'Selecting Number of Threads',
    default: 0,
});

/**
 * SETTING POOL
 */

// Pool
commands.add({
    name: 'pool:name',
    help: 'Sets a name for your pool',
});

commands.add({
    name: 'pool:address',
    help: 'Sets the mining address of your pool\n\
        Notes:\n\
        if not specified it uses the first address from database\n\
        if no address in database, it creates a new one and uses it\n\
        Example:\n\
        pool:address=\'value\' (wrap the value in single quotes)',
    default: false,
});

commands.add({
    name: 'pool:url',
    help: 'Sets the url of your pool\n\
        Example:\n\
        pool:url=\'value\' (wrap the value in single quotes)',
    default: false,
});

commands.add({
    name: 'pool:fee',
    help: 'Sets the percentage fee of your pool',
    default: .5,
});

commands.add({
    name: 'pool:referral_fee',
    help: 'Sets the percetange referral fee of your pool',
    default: .5,
});

commands.add({
    name: 'pool:run',
    help: 'Starts the pool',
});

// Add commands logic:
// if (!commands.find('test')) {
//     Commands.exit('Command "test" is missing!');
// }

// Process & save
commands.process();
Commands.save(commands);
