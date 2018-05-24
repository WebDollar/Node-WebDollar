let AGENT_STATUS = {

    AGENT_STATUS_NOT_SYNCHRONIZED : 0, // not synchronized
    AGENT_STATUS_SYNCHRONIZED : 2, //synchronized based on the fallback nodes

    AGENT_STATUS_SYNCHRONIZED_SLAVES : 3, //synchronized based on others (not fallback nodes)

};

export default AGENT_STATUS;