const uuid = require('uuid');

let consts = {};

consts.TERMINATED = false;

consts.UUID = uuid.v4();

consts.NODE_VERSION = "0.251";
consts.NODE_VERSION_COMPATIBILITY = "0.251";

consts.WALLET_VERSION = "0.1";

consts.BLOCKCHAIN = {

    DIFFICULTY:{
        NO_BLOCKS : 10
    },

    TIMESTAMP:{
        VALIDATION_NO_BLOCKS: 10,
        NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET: 10*60*1000,
        NETWORK_ADJUSTED_TIME_NODE_MAX_UTC_DIFFERENCE: 10*60*1000,
    },

    DIFFICULTY_TIME : 200, //in s, timestamp in UNIX format

    BLOCKS_POW_LENGTH: 32,
    BLOCKS_NONCE : 4,

    LIGHT:{
        VALIDATE_LAST_BLOCKS: 10 , //overwrite below
        SAFETY_LAST_BLOCKS: 40, //overwrite below
    },

    HARD_FORKS : {
        TEST_NET_3:{
            DIFFICULTY_HARD_FORK: 112809
        },
    }

};
consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS = consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * 1 ;
consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS = consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS + 2* consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS ;

consts.MINI_BLOCKCHAIN = {
    TOKEN_ID_LENGTH :32,
};


consts.POPOW_PARAMS={
    m: 6,
    k: 6,
    d: 0.5,
    BLOCKS_LEVEL_INFINITE: 1 << 30,
    ACTIVATED : false,
};


consts.NODE_PROTOCOL = "WebDollar";
consts.NODE_FALLBACK_INTERVAL =  10*1000; //miliseconds
consts.NODE_PORT =  12320; //port
consts.NODE_STATUS_INTERVAL =  60*1000; //miliseconds


consts.NODES_WAITLIST_TRY_RECONNECT_AGAIN =  60*1000; //miliseconds
consts.NODES_WAITLIST_INTERVAL =  5*1000; //miliseconds

consts.NODES_SIGNALING_SERVER_PROTOCOL_CONNECTING_WEB_PEERS_INTERVAL = 2*1000;


consts.PRIVATE_KEY_USE_BASE64 = true;
consts.PRIVATE_KEY_VERSION_PREFIX = "80"; //it is in HEX
consts.PRIVATE_KEY_CHECK_SUM_LENGTH = 4; //in bytes
consts.PRIVATE_KEY_LENGTH = 32; //ending BASE64 HEX

consts.PUBLIC_ADDRESS_VERSION_PREFIX = "00"; //ending BASE64 HEX
consts.PUBLIC_ADDRESS_LENGTH = 32; //ending BASE64 HEX
consts.PUBLIC_ADDRESS_CHECK_SUM_LENGTH = 4; //in bytes

consts.PUBLIC_KEY_LENGTH = 32; //ending BASE64 HEX

consts.PUBLIC_ADDRESS_PREFIX_BASE64 = "584043fe"; //BASE64 HEX  WEBD$
                                      //WEBD  584043
                                      //WEBD$ 584043FF

consts.PUBLIC_ADDRESS_SUFFIX_BASE64 = "EC3F"; //ending BASE64 HEX
                                       //#w$ EC3F
                                       //%#$ 8FBF

consts.PUBLIC_ADDRESS_PREFIX_BASE58 = "00"; //BASE58 HEX and it will be converted to Base64/58
consts.PUBLIC_ADDRESS_SUFFIX_BASE58 = "";


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
}

// change also to Browser-Mining-WebWorker.js


consts.MAX_UINT32 = 1 << 30;

consts.BLOCKS_MAX_SIZE_BYTES = 1024 * 1024 * 1; // in bytes
consts.SOCKET_MAX_SIZE_BYRES = consts.BLOCKS_MAX_SIZE_BYTES + 20;


//
consts.DATABASE_NAMES={
    DEFAULT_DATABASE: "defaultDB",
    WALLET_DATABASE: "defaultDB", //IT SHOULD BE REPALCED BY IN TEST NET 4 "walletDB",
    //TODO REPLACE with "walletDB"
    BLOCKCHAIN_DATABASE: "blockchainDB3",
    BLOCKCHAIN_DATABASE_FILE_NAME : 'blockchain4.bin',
    POOL_DATABASE: "poolDB",
    VALIDATE_DATABASE: "validateDB",
    TESTS_DATABASE: "testDB",
    TRANSACTIONS_DATABASE: "transactionsDB"
};

export default consts