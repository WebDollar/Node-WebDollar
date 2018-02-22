import BlockchainnetworkTimestamp from "./Blockchain-Network-Adjusted-Time"

class BlockchainTimestamp{

    constructor(){

        this.networkAdjustedTimestamp = new BlockchainnetworkTimestamp(this);

    }

    /**
     * Returns UTC timestamp
     *
     * see stackoverflow: https://stackoverflow.com/a/8047885
     *
     * @returns {number}
     */
    get timeUTC(){
        return new Date().getTime();
    }

    get time(){
        return new Date();
    }

    /**
     * return in minutes
     */
    get localTime(){
        let offset = new Date().getTimezoneOffset();
        return offset;
    }



}

export default BlockchainTimestamp;