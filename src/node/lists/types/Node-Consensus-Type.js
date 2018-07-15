const NODES_CONSENSUS_TYPE = {

    NODE_CONSENSUS_PEER: 0,

    NODE_CONSENSUS_SERVER: 1, //simple server
    NODE_CONSENSUS_SERVER_FOR_POOL: 2, //server for pool
    NODE_CONSENSUS_SERVER_FOR_MINER: 3, //server for miner pool

    NODE_CONSENSUS_POOL: 4, //consensus for a POOL
    NODE_CONSENSUS_MINER_POOL: 5, //consensus for a MINER

};

export default NODES_CONSENSUS_TYPE;