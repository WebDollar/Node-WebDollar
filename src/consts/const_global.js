const uuid = require('uuid');

let consts = {

    DEBUG: false,

};

consts.BLOCKCHAIN = {

    DIFFICULTY:{
        NO_BLOCKS : 10,
        TIME_PER_BLOCK : 20, //in s, timestamp in UNIX format
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
        SAFETY_LAST_BLOCKS_DELETE: 400, //overwrite below
    },

    HARD_FORKS : {

    }


};

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
    m: 6,
    k: 6,
    d: 0.5,
    BLOCKS_LEVEL_INFINITE: 1 << 30,
    ACTIVATED : false,
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
    salt: 'WebDollar_make_$',
    saltBuffer: Buffer.from("WebDollar_make_$"),
    time: 2,
    memPower:10,
    memBytes: 1024,
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

    DEFAULT_DATABASE: "defaultDB",

    //WALLET_DATABASE: "walletDB", //IT SHOULD BE REPALCED BY IN TEST NET 4 "walletDB",
    WALLET_DATABASE: "defaultDB2", //IT SHOULD BE REPALCED BY IN TEST NET 4 "walletDB",

    BLOCKCHAIN_DATABASE:{
        FOLDER:"blockchainDB3",
        FILE_NAME : 'blockchain4.bin',
    },

    POOL_DATABASE: "poolDB",
    VALIDATE_DATABASE: "validateDB",
    TESTS_DATABASE: "testDB",
    TRANSACTIONS_DATABASE: "transactionsDB"

};

consts.MINING_POOL = {

    WINDOW_SIZE: 16,
    BASE_HASH_STRING: "00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",

    MINING:{
        FEE_THRESHOLD: 100,
        MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR: 13
    },

};





consts.SETTINGS = {

    UUID: uuid.v4(),

    NODE: {
        VERSION: "0.281",
        VERSION_COMPATIBILITY: "0.281",
        PROTOCOL: "WebDollar",
        SSL: true,


        PORT: 80, //port
    },

    PARAMS: {
        FALLBACK_INTERVAL: 10 * 1000,                     //miliseconds
        STATUS_INTERVAL: 60 * 1000,                      //miliseconds

        WAITLIST: {
            TRY_RECONNECT_AGAIN: 60 * 1000,             //miliseconds
            INTERVAL: 5 * 1000,                         //miliseconds
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

            NODES: {
                MAXIMUM_CONNECTIONS: 100,
            },

            WEBRTC: {
                MAXIMUM_CONNECTIONS: 5,
            },

            FORKS:{
                MAXIMUM_BLOCKS_TO_DOWNLOAD: 40,
            }

        },

    },

    MEM_POOL : {

        TIME_LOCK : {
            TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION: consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS,
        }

    },

    MAX_UINT32: 1 << 30,

};



if ( consts.DEBUG === true ){
    consts.SETTINGS.NODE.VERSION += "1";
    consts.SETTINGS.NODE.VERSION_COMPATIBILITY += "1";
    consts.SETTINGS.NODE.SSL = false;
    consts.MINING_POOL.MINING.MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR = 10000;
}


export default consts