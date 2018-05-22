const uuid = require('uuid');
import FallBackNodesList from 'node/sockets/node-clients/service/discovery/fallbacks/fallback_nodes_list';

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
    BLOCKS_NONCE : 4,

    LIGHT:{

        VALIDATE_LAST_BLOCKS: 10 , //overwrite below
        SAFETY_LAST_BLOCKS: 40, //overwrite below

        SAFETY_LAST_BLOCKS_DELETE_BROWSER: 500, //overwrite below
        SAFETY_LAST_BLOCKS_DELETE_NODE: 100, //overwrite below

        SAFETY_LAST_ACCOUNTANT_TREES: 50, //overwrite below

        SAFETY_LAST_BLOCKS_DELETE: undefined,

    },

    HARD_FORKS : {

        TRANSACTIONS_BUG_2_BYTES: 46950,

    }

};

consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE = (process.env.BROWSER ? consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE_BROWSER : consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE_NODE );

consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS = consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * 1 ;
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
        MAXIMUM_IDENTICAL_OUTPUTS: 500,
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
        FILE_NAME : 'blockchain4.bin'+(process.env.INSTANCE_PREFIX||""),
    },

    POOL_DATABASE: "poolDB"+(process.env.INSTANCE_PREFIX||""),
    VALIDATE_DATABASE: "validateDB"+(process.env.INSTANCE_PREFIX||""),
    TESTS_DATABASE: "testDB"+(process.env.INSTANCE_PREFIX||""),
    TRANSACTIONS_DATABASE: "transactionsDB"+(process.env.INSTANCE_PREFIX||"")

};

consts.MINING_POOL = {

    WINDOW_SIZE: 16,
    BASE_HASH_STRING: "00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",

    MINING:{
        FEE_THRESHOLD: 100000,
        MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR: 13
    },

};


consts.SETTINGS = {

    UUID: uuid.v4(),

    NODE: {

        VERSION: "1.133.4",
        VERSION_COMPATIBILITY: "1.13",
        PROTOCOL: "WebDollar",
        SSL: true,

        PORT: 80, //port
    },

    PARAMS: {
        FALLBACK_INTERVAL: 10 * 1000,                     //miliseconds
        STATUS_INTERVAL: 20 * 1000,                      //miliseconds

        WAITLIST: {
            TRY_RECONNECT_AGAIN: 30 * 1000,             //miliseconds
            INTERVAL: 2 * 1000,                         //miliseconds
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

            NO_OF_IDENTICAL_IPS: 3,

            SOCKETS_TO_PROPAGATE_NEW_BLOCK_TIP: 50,

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
                        MAX_SOCKET_CLIENTS_WAITLIST_WHEN_SSL: 8,
                        MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK_WHEN_SSL: 8,
                    },
                },

                SERVER: {
                    MAXIMUM_CONNECTIONS_FROM_TERMINAL: 100,

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
            },

            TIMEOUT: {
                WAIT_ASYNC_DISCOVERY_TIMEOUT: 7500,
            }

        },

    },

    MEM_POOL : {

        TIME_LOCK : {
            TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION: consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS,
        }

    },


};

if (process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER !== undefined)
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER = process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER;

if (process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL !== undefined)
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL = process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL;

if (process.env.MAXIMUM_CONNECTIONS_IN_TERMINAL !== undefined)
    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MAXIMUM_CONNECTIONS_IN_TERMINAL = process.env.MAXIMUM_CONNECTIONS_IN_TERMINAL;


if ( consts.DEBUG === true ){

    consts.SETTINGS.NODE.VERSION += "3";
    consts.SETTINGS.NODE.VERSION_COMPATIBILITY += "3";
    consts.SETTINGS.NODE.SSL = false;
    consts.MINING_POOL.MINING.MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR = 10000;

    consts.SETTINGS.NODE.PORT = 9095;

    FallBackNodesList.nodes = [{
        "addr": ["http://127.0.0.1:9095"],
    }];


}

consts.SETTINGS.NODE.PORT = 9095;
consts.SETTINGS.NODE.SSL = false;

export default consts