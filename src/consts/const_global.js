exports.nodeVersion = "0.0.1";
exports.nodeVersionCompatibility = "1.0";
exports.nodeProtocol = "WebDollar";
exports.nodeFallBackInterval =  10*1000; //miliseconds
exports.nodePort =  12320; //port
exports.nodeStatusInterval =  20*1000; //miliseconds


exports.nodesWaitlistTryReconnectAgain =  60*1000; //miliseconds
exports.nodesWaitlistInterval =  5*1000; //miliseconds

exports.nodesSignalingServerProtocolConnectingWebPeersInterval = 2*1000;


exports.PRIVATE_KEY_USE_BASE64 = true;
exports.PRIVATE_KEY_VERSION_PREFIX = "80"; //it is in HEX
exports.PRIVATE_KEY_CHECK_SUM_LENGTH = 8; //in bytes

exports.PUBLIC_ADDRESS_PREFIX_BASE64 = "584043fe"; //BASE64 HEX  WEBD$
                                      //WEBD  584043
                                      //WEBD$ 584043FF

exports.PUBLIC_ADDRESS_SUFFIX_BASE64 = "EC3F"; //ending BASE64 HEX
                                       //#w$ EC3F
                                       //%#$ 8FBF

exports.PUBLIC_ADDRESS_PREFIX_BASE58 = "00"; //BASE58 HEX and it will be converted to Base64/58
exports.PUBLIC_ADDRESS_SUFFIX_BASE58 = "";