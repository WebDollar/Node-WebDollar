const uuid = require('uuid');
import FallBackNodesList from 'node/sockets/node-clients/service/discovery/fallbacks/fallback_nodes_list';
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
        NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET: 10*60,
        NETWORK_ADJUSTED_TIME_NODE_MAX_UTC_DIFFERENCE: 10*60,
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
        SAFETY_LAST_ACCOUNTANT_TREES_TO_DELETE: 150, //overwrite below

        SAFETY_LAST_BLOCKS_DELETE: undefined,

        GZIPPED: false,

    },


    HARD_FORKS : {

        TRANSACTIONS_BUG_2_BYTES: 46950,


        TRANSACTIONS_OPTIMIZATION: 153060,
        DIFFICULTY_TIME_BIGGER: 153060,
        WALLET_RECOVERY: 153060,

        DIFFICULTY_REMOVED_CONDITION: 161990,

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
    distPath: 'https://antelle.github.io/argon2-browser/dist'
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
        FEE_PER_BYTE: 600, // in WEBD
        MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR: 13
    },

    CONNECTIONS:{

        NO_OF_IDENTICAL_IPS: 80,

    },



};

consts.SETTINGS = {

    UUID: uuid.v4(),

    NODE: {

        VERSION: "1.175",
        VERSION_COMPATIBILITY: "1.162.0",

        VERSION_COMPATIBILITY_UPDATE: "",
        VERSION_COMPATIBILITY_UPDATE_BLOCK_HEIGHT: 0,

        PROTOCOL: "WebDollar",
        SSL: true,

        PORT: 80, //port
        MINER_POOL_PORT: 8086, //port

    },

    PARAMS: {
        FALLBACK_INTERVAL: 10 * 1000,                     //miliseconds
        STATUS_INTERVAL: 40 * 1000,                      //miliseconds

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
            BLOCKS_MAX_SIZE_BYTES : 1 * 1024 * 1024 ,       // in bytes
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
                    MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK: 1,

                    MIN_SOCKET_CLIENTS_WAITLIST: 0,
                    MIN_SOCKET_CLIENTS_WAITLIST_FALLBACK: 1,

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
                MAXIMUM_BLOCKS_TO_DOWNLOAD: 100,
                MAXIMUM_BLOCKS_TO_DOWNLOAD_TO_USE_SLEEP: 30,
            },

            TIMEOUT: {
                WAIT_ASYNC_DISCOVERY_TIMEOUT: 7500,
            }

        },

    },

    MEM_POOL : {

        TIME_LOCK : {
            TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION: 2 * consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS,
        },

        MAXIMUM_TRANSACTIONS_TO_DOWNLOAD: 100,

    }
};

consts.TERMINAL_WORKERS = {

    // file gets created on build
    CPU_WORKER_NONCES_WORK: 700,  //per seconds

    CPU_CPP_WORKER_NONCES_WORK: 40000,  //per second
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
    TYPE: "cpu", //cpu-cpp

    // file gets created on build
    PATH: './dist_bundle/terminal_worker.js',
    PATH_CPP: './dist_bundle/CPU/argon2-bench2',
    PATH_GPU: './dist_bundle/GPU/argon2-gpu-test',

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
    CPU_MAX: 0, //for CPU-CPP use, 2x or even 3x threads
};

if (process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER !== undefined)
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER = process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER;

if (process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL !== undefined)
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL = process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL;


if ( consts.DEBUG === true ){

    consts.SETTINGS.NODE.VERSION = "3"+consts.SETTINGS.NODE.VERSION;
    consts.SETTINGS.NODE.VERSION_COMPATIBILITY = "3"+consts.SETTINGS.NODE.VERSION_COMPATIBILITY;
    consts.SETTINGS.NODE.SSL = false;
    consts.MINING_POOL.MINING.MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR = 10000;

    consts.SETTINGS.NODE.PORT = 8082;

    //consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_BUG_2_BYTES = 100;

    FallBackNodesList.nodes = [{
        "addr": ["http://127.0.0.1:8085"],
    }];


}


export default consts
