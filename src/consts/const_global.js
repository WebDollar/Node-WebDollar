
let consts = {}

consts.NODE_VERSION = "0.0.1";
consts.NODE_VERSION_COMPATIBILITY = "1.0";
consts.NODE_PROTOCOL = "WebDollar";
consts.NODE_FALLBACK_INTERVAL =  10*1000; //miliseconds
consts.NODE_PORT =  12320; //port
consts.NODE_STATUS_INTERVAL =  20*1000; //miliseconds


consts.NODES_WAITLIST_TRY_RECONNECT_AGAIN =  60*1000; //miliseconds
consts.NODES_WAITLIST_INTERVAL =  5*1000; //miliseconds

consts.NODES_SIGNALING_SERVER_PROTOCOL_CONNECTING_WEB_PEERS_INTERVAL = 2*1000;


consts.PRIVATE_KEY_USE_BASE64 = true;
consts.PRIVATE_KEY_VERSION_PREFIX = "80"; //it is in HEX
consts.PRIVATE_KEY_CHECK_SUM_LENGTH = 8; //in bytes

consts.PUBLIC_ADDRESS_PREFIX_BASE64 = "584043fe"; //BASE64 HEX  WEBD$
                                      //WEBD  584043
                                      //WEBD$ 584043FF

consts.PUBLIC_ADDRESS_SUFFIX_BASE64 = "EC3F"; //ending BASE64 HEX
                                       //#w$ EC3F
                                       //%#$ 8FBF

consts.PUBLIC_ADDRESS_PREFIX_BASE58 = "00"; //BASE58 HEX and it will be converted to Base64/58
consts.PUBLIC_ADDRESS_SUFFIX_BASE58 = "";

consts.HASH_ARGON2_PARAMS = {salt: 'WebDollar_make_$', saltBuffer: Buffer.from(['W','e','b','D','o','l','l','a','r','_','m','a','k','e','_','$']),time: 4, memPower:13, memBytes: 8192, parallelism: 2, type: 0, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist' }

export default consts