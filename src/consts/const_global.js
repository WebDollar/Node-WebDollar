/* eslint-disable */
const uuid = require('uuid');
import FallBackNodesList from 'node/sockets/node-clients/service/discovery/fallbacks/fallback_nodes_list';
import  Utils from "common/utils/helpers/Utils"

const BigNumber = require('bignumber.js');
const BigInteger = require('big-integer');

let consts = {

    DEBUG: false,
    OPEN_SERVER: true,

};

consts.BLOCKCHAIN = {

    DIFFICULTY:{
        NO_BLOCKS : 10,
        TIME_PER_BLOCK : 40, //in s, timestamp in UNIX format
    },

    TIMESTAMP:{
        VALIDATION_NO_BLOCKS: 10,

        NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET_AFTER_POS: 30,

        NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET: 10*60,
        NETWORK_ADJUSTED_TIME_NODE_MAX_UTC_DIFFERENCE: 30,
    },

    POS: {
        MINIMUM_AMOUNT: 100,
        MINIMUM_POS_TRANSFERS: 30,
    },

    BLOCKS_POW_LENGTH: 32,
    BLOCKS_MAX_TARGET: new BigNumber("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
    BLOCKS_MAX_TARGET_BIG_INTEGER: new BigInteger("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16),
    BLOCKS_MAX_TARGET_BUFFER: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
    BLOCKS_NONCE : 4,

    LIGHT:{

        VALIDATE_LAST_BLOCKS: 10 , //overwrite below
        SAFETY_LAST_BLOCKS: 40, //overwrite below

        SAFETY_LAST_BLOCKS_DELETE_BROWSER: 500, //overwrite below
        SAFETY_LAST_BLOCKS_DELETE_NODE: 100, //overwrite below

        SAFETY_LAST_ACCOUNTANT_TREES: 50, //overwrite below
        SAFETY_LAST_ACCOUNTANT_TREES_TO_DELETE: 60, //overwrite below

        SAFETY_LAST_BLOCKS_DELETE: undefined,

        GZIPPED: false,

    },

    FORKS:{

        //forks larger than this will not be accepted
        IMMUTABILITY_LENGTH: 60,

    },

    HARD_FORKS : {

        WALLET_RECOVERY: 153060,

        TRANSACTIONS_BUG_2_BYTES: 46950,
        TRANSACTIONS_OPTIMIZATION: 153060,

        DIFFICULTY_TIME_BIGGER: 153060,
        DIFFICULTY_REMOVED_CONDITION: 161990,

        TRANSACTIONS_INCLUDING_ONLY_HEADER: 567698, // SAME AS POS
        POS_ACTIVATION: 567810,

    }

};

consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE = (process.env.BROWSER ? consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE_BROWSER : consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE_NODE );

consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS = consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * 2 ;
consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS = consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS + 2* consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS ;

consts.MINI_BLOCKCHAIN = {

    TOKENS: {

        OTHER_TOKENS:{
            LENGTH: 24,
            ACTIVATED: -1, // not activated
        },

        WEBD_TOKEN:{
            LENGTH: 1,
            VALUE: 0x01,
        }

    }
};


consts.POPOW_PARAMS={
    m: 30, //length proof Pi for validating the Genesis

    k: 30, //length proof Xi for Accountant Tree
    k1: 30, //length

    d: 0.5,

    ACTIVATED : true,
};


consts.TRANSACTIONS = {

    VERSIONS:{
        SCHNORR_VERSION: 0x01,
    },

    SIGNATURE_SCHNORR:{
        LENGTH : 64
    },

};

consts.SPAM_GUARDIAN = {

    TRANSACTIONS:{
        MAXIMUM_IDENTICAL_INPUTS: 10,
        MAXIMUM_IDENTICAL_OUTPUTS: 255,
        MAXIMUM_DIFF_NONCE_ACCEPTED_FOR_QUEUE: 500,
        MAXIMUM_MISSING_NONCE_SEARCH: 5
    }

};

consts.ADDRESSES = {

    PRIVATE_KEY:{
        WIF:{
            VERSION_PREFIX : "80", //it is in HEX
            CHECK_SUM_LENGTH : 4, //in bytes
        },
        LENGTH : 64, //ending BASE64 HEX
    },
    PUBLIC_KEY:{
        LENGTH : 32, //ending BASE64 HEX
    },

    ADDRESS:{

        USE_BASE64 : true,

        LENGTH : 20,

        WIF:{
            LENGTH: 0,

            VERSION_PREFIX : "00", //ending BASE64 HEX
            CHECK_SUM_LENGTH : 4, //in bytes   //ending BASE64 HEX

            PREFIX_BASE64 : "584043fe", //BASE64 HEX  WEBD$
            //WEBD  584043
            //WEBD$ 584043FF

            SUFFIX_BASE64 : "FF", //ending BASE64 HEX
            //#w$ EC3F
            //%#$ 8FBF

            PREFIX_BASE58 : "00", //BASE58 HEX and it will be converted to Base64/58
            SUFFIX_BASE58 : "",
        }

    },

};

let prefix = ( consts.ADDRESSES.ADDRESS.USE_BASE64 ? consts.ADDRESSES.ADDRESS.WIF.PREFIX_BASE64 : consts.ADDRESSES.ADDRESS.WIF.PREFIX_BASE58);
let suffix = ( consts.ADDRESSES.ADDRESS.USE_BASE64 ? consts.ADDRESSES.ADDRESS.WIF.SUFFIX_BASE64 : consts.ADDRESSES.ADDRESS.WIF.SUFFIX_BASE58);
consts.ADDRESSES.ADDRESS.WIF.LENGTH = consts.ADDRESSES.ADDRESS.LENGTH + consts.ADDRESSES.ADDRESS.WIF.CHECK_SUM_LENGTH + consts.ADDRESSES.ADDRESS.WIF.VERSION_PREFIX.length/2 + prefix.length/2 + suffix.length/2;

consts.HASH_ARGON2_PARAMS = {
    salt: 'Satoshi_is_Finney',
    saltBuffer: Buffer.from("Satoshi_is_Finney"),
    time: 2,
    memPower: 8,
    memBytes: 256,
    parallelism: 2,
    //argon2d
    algoNode: 0,
    algoBrowser: 0,
    hashLen: 32,
    // distPath: 'https://webdollar.io/public/WebDollar-dist/argon2'
    distPath: 'https://antelle.net/argon2-browser/'
};

// change also to Browser-Mining-WebWorker.js

//DATABASE NAMES
consts.DATABASE_NAMES = {

    DEFAULT_DATABASE: "defaultDB"+(process.env.INSTANCE_PREFIX||""),

    WALLET_DATABASE: "defaultDB2"+(process.env.INSTANCE_PREFIX||""),

    //TODO IT SHOULD BE REPLACED with "walletDB",

    BLOCKCHAIN_DATABASE:{
        FOLDER:"blockchainDB3"+(process.env.INSTANCE_PREFIX||""),
        FILE_NAME : 'blockchain4.bin',
    },

    POOL_DATABASE: "poolDB"+(process.env.INSTANCE_PREFIX||""),
    SERVER_POOL_DATABASE: "serverPoolDB"+(process.env.INSTANCE_PREFIX||""),
    MINER_POOL_DATABASE: "minerPoolDB"+(process.env.INSTANCE_PREFIX||""),

    VALIDATE_DATABASE: "validateDB"+(process.env.INSTANCE_PREFIX||""),
    TESTS_DATABASE: "testDB"+(process.env.INSTANCE_PREFIX||""),
    TRANSACTIONS_DATABASE: "transactionsDB"+(process.env.INSTANCE_PREFIX||"")

};

consts.MINING_POOL_TYPE = {

    MINING_POOL_DISABLED: 0,

    MINING_POOL_SERVER: 1,
    MINING_POOL: 2,
    MINING_POOL_MINER: 3,

};

consts.MINING_POOL = {

    MINING_POOL_STATUS : (process.env.MINING_POOL_STATUS || consts.MINING_POOL_TYPE.MINING_POOL_DISABLED),

    MINING:{
        MINING_POOL_MINIMUM_PAYOUT: 200000,
        FEE_PER_BYTE: 580, // in WEBD

        MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR: 13
    },

    CONNECTIONS:{

        NO_OF_IDENTICAL_IPS: 101,
        PUSH_WORK_MAX_CONNECTIONS_CONSECUTIVE: 0,       //0  - means unlimited, it requires a lot of bandwidth
                                                        //30 - means after sending to 30 pool miners, it will do a sleep of 10 ms

    },

    SEMI_PUBLIC_KEY_CONSENSUS: undefined, //undefined or an array of SEMI_PUBLIC_KEYS



};

consts.SETTINGS = {

    UUID: uuid.v4(),

    NODE: {

        VERSION: "1.202.0",

        VERSION_COMPATIBILITY: "1.200.1",
        VERSION_COMPATIBILITY_POOL_MINERS: "1.200.1",

        VERSION_COMPATIBILITY_UPDATE: "",
        VERSION_COMPATIBILITY_UPDATE_BLOCK_HEIGHT: 0,

        PROTOCOL: "WebDollar",
        SSL: true,

        PORT: 80, //port
        MINER_POOL_PORT: 8086, //port

    },

    PARAMS: {
        FALLBACK_INTERVAL: 10 * 1000,                     //miliseconds
        STATUS_INTERVAL: 40 * 1000,
        LATENCY_CHECK: 5*1000,
        MAX_ALLOWED_LATENCY: 6*1000,  //miliseconds
        CONCURRENCY_BLOCK_DOWNLOAD_MINERS_NUMBER: (process.env.BROWSER? 10 : 30),


        WAITLIST: {
            TRY_RECONNECT_AGAIN: 30 * 1000,             //miliseconds
            INTERVAL: 2 * 1000,                         //miliseconds

            //banned nodes
            BLOCKED_NODES: [ ], //addresses that will be blocked example: "domain.com"
        },

        SIGNALING: {
            SERVER_PROTOCOL_CONNECTING_WEB_PEERS_INTERVAL: 2 * 1000,
        },

        MAX_SIZE: {
            BLOCKS_MAX_SIZE_BYTES : 1 * 1024 * 1024 ,      // in bytes
            SOCKET_MAX_SIZE_BYRES : 3 * 1024 * 1024 + 50,    // in bytes

            SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES: 32 * 1024, //32 kb
            MINIMUM_SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES: 32 *1024, //32 kb
        },

        WALLET:{
            VERSION: "0.1"
        },

        CONNECTIONS:{

            NO_OF_IDENTICAL_IPS: 20,

            SOCKETS_TO_PROPAGATE_NEW_BLOCK_TIP: 100,

            TERMINAL:{

                CLIENT: {

                    MAX_SOCKET_CLIENTS_WAITLIST: 3,
                    MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK: 3,

                    MIN_SOCKET_CLIENTS_WAITLIST: 0,
                    MIN_SOCKET_CLIENTS_WAITLIST_FALLBACK: 2,

                    SERVER_OPEN:{
                        MAX_SOCKET_CLIENTS_WAITLIST: 5,
                        MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK: 3,
                    },

                    SSL:{
                        MAX_SOCKET_CLIENTS_WAITLIST_WHEN_SSL: 20,
                        MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK_WHEN_SSL: 10,
                    },
                },


                SERVER: {
                    MAXIMUM_CONNECTIONS_FROM_TERMINAL: 400,
                    MAXIMUM_CONNECTIONS_FROM_BROWSER: 1000,

                    MAXIMUM_CONNECTIONS_FROM_BROWSER_POOL: 2000,
                    MAXIMUM_CONNECTIONS_FROM_TERMINAL_POOL: 2000,

                    TERMINAL_CONNECTIONS_REQUIRED_TO_DISCONNECT_FROM_FALLBACK: 10,
                },

            },

            BROWSER:{

                CLIENT: {
                    MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST: 4,
                    MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST_FALLBACK: 2,

                    MIN_SOCKET_CLIENTS_WAITLIST: 0,
                    MIN_SOCKET_CLIENTS_WAITLIST_FALLBACK: 1,
                },

                SERVER: {},

                WEBRTC: {
                    MAXIMUM_CONNECTIONS: 13,
                },

            },

            COMPUTED: {
                CLIENT:{

                },
                SERVER:{

                },
            },

            FORKS:{
                MAXIMUM_BLOCKS_TO_DOWNLOAD: 300,
                MAXIMUM_BLOCKS_TO_DOWNLOAD_TO_USE_SLEEP: 30,
            },

            TIMEOUT: {
                WAIT_ASYNC_DISCOVERY_TIMEOUT: 7500,
            }

        },

    },

    MEM_POOL : {

        TIME_LOCK : {
            TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION: 10 * consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS,
        },

        MAXIMUM_TRANSACTIONS_TO_DOWNLOAD: 1000,

        MINIMUM_TRANSACTION_AMOUNT: 100000, //10 WEBD

    },
    GEO_IP_ENABLED: true,
    FREE_TRANSACTIONS_FROM_MEMORY_MAX_NUMBER: 50000, //use 0 to be disabled
};

consts.TERMINAL_WORKERS = {

    // file gets created on build
    CPU_WORKER_NONCES_WORK: 700,  //per seconds

    CPU_CPP_WORKER_NONCES_WORK: 0,  //per second   0 is undefined
    CPU_CPP_WORKER_NONCES_WORK_BATCH: 500,  //per second

    //NONCES_WORK should be way bigger than WORK_BATCHES


    //TODO
    GPU_WORKER_NONCES_WORK: 20000, //per blocks, should be batches x 10 seconds
    GPU_WORKER_NONCES_WORK_BATCH: 200, //per blocks

    /**
     * cpu
     * cpu-cpp
     * gpu
     */
    TYPE: process.env.TERMINAL_WORKERS_TYPE || "cpu", //cpu-cpp, or gpu

    // file gets created on build
    PATH: './dist_bundle/terminal_worker.js',

    PATH_CPP: Utils.isWin ? '' : './dist_bundle/CPU/', //Unix are in folders, Win32 is in root
    PATH_CPP_FILENAME: 'argon2-bench2' + (Utils.isWin ? '.exe' : ''),

    PATH_GPU: Utils.isWin ? '' : './dist_bundle/GPU/', //Unix are in folders, Win32 is in root
    PATH_GPU_FILENAME: 'argon2-gpu-test' + (Utils.isWin ? '.exe' : ''),

    GPU_MODE: "opencl", //opencl
    GPU_MAX: 1,
    GPU_INSTANCES: 1,

    // make it false to see their output (console.log's, errors, ..)
    SILENT: true,

    // -1 disables multi-threading.
    //  0 defaults to number of cpus / 2.
    //
    //  Threading isn't used:
    //  - if it detects only 1 cpu.
    //  - if you use 0 and u got only 2 cpus.

    //  -100 no CPU mining

    CPU_MAX: parseInt(process.env.TERMINAL_WORKERS_CPU_MAX) || 0, //for CPU-CPP use, 2x or even 3x threads

};

consts.JSON_RPC = {
    version: '1.0.0',
    serverConfig: {
        host: process.env.JSON_RPC_SERVER_HOST || '127.0.0.1',
        port: process.env.JSON_RPC_SERVER_PORT,
    },

    // @see express-basic-auth package for configuration (except isEnabled)
    basicAuth: {
        users    : {},
        isEnabled: process.env.JSON_RPC_BASIC_AUTH_ENABLE || false
    },

    // @see express-rate-limit package for configuration (except isEnabled)
    rateLimit: {
        windowMs : process.env.JSON_RPC_RATE_LIMIT_WINDOW       || 60 * 1000, // 1 minute
        max      : process.env.JSON_RPC_RATE_LIMIT_MAX_REQUESTS || 60,        // limit each IP to 60 requests per windowMs,
        isEnabled: process.env.JSON_RPC_RATE_LIMIT_ENABLE       || true
    },
};

if ( process.env.JSON_RPC_BASIC_AUTH_USER  && process.env.JSON_RPC_BASIC_AUTH_PASS ) {

    consts.JSON_RPC.basicAuth.users[process.env.JSON_RPC_BASIC_AUTH_USER] = process.env.JSON_RPC_BASIC_AUTH_PASS;

    if ( consts.JSON_RPC.basicAuth.isEnabled )
        consts.JSON_RPC.basicAuth.isEnabled = true;
}

if (process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER )
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER = process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER;

if (process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL)
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL = process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL;

consts.NETWORK_TYPE = {
    id: 1,
    name: "Webdollar MainNet"
};

if ( consts.DEBUG === true ) {

    consts.MINING_POOL.SKIP_POW_REWARDS = false;
    consts.MINING_POOL.SKIP_POS_REWARDS = false;

    consts.SETTINGS.NODE.VERSION = "3"+consts.SETTINGS.NODE.VERSION;
    consts.SETTINGS.NODE.VERSION_COMPATIBILITY = "3"+consts.SETTINGS.NODE.VERSION_COMPATIBILITY;
    consts.SETTINGS.NODE.SSL = false;
    consts.MINING_POOL.MINING.MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR = 10000;

    //hard-forks
    consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_BUG_2_BYTES = 60;
    consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_OPTIMIZATION = 70;
    consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_TIME_BIGGER = 70;
    consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION = 80;
    consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION = 90;
    consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_INCLUDING_ONLY_HEADER = consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION;

    consts.SETTINGS.NODE.PORT = 2024;

    FallBackNodesList.nodes = [{
        "addr": ["http://testnet2.hoste.ro:8001"],
        //"addr": ["http://86.126.138.61:2024"],
    }];

    consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_INPUTS = 1000;
    consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_OUTPUTS = 1000;

    consts.SETTINGS.NODE.VERSION = "1.210.6" ;
    consts.SETTINGS.NODE.VERSION_COMPATIBILITY = "1.210.6";
    consts.SETTINGS.NODE.VERSION_COMPATIBILITY_POOL_MINERS = "1.210.6";

}

if (process.env.NETWORK && process.env.NETWORK !== '' && process.env.NETWORK === 'testnet') {

    FallBackNodesList.nodes = FallBackNodesList.nodes_testnet;

    consts.NETWORK_TYPE = {
        id: 2,
        name: "Webdollar TestNet"
    };

}

if (process.env.NETWORK !== undefined && process.env.NETWORK !== '' && process.env.NETWORK === 'testnet')
    FallBackNodesList.nodes = FallBackNodesList.nodes_testnet;

export default consts;
