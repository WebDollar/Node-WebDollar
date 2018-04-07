import BlockchainnetworkTime from "./Blockchain-Network-Adjusted-Time"
import NodesList from 'node/lists/nodes-list'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class BlockchainTimestamp{

    constructor(){

        this._networkAdjustedTime = new BlockchainnetworkTime(this);

    }


    get networkAdjustedTime(){
        return this._networkAdjustedTime.networkAdjustedTime;
    }

    /**
     * Returns UTC timestamp
     *
     * see stackoverflow: https://stackoverflow.com/a/8047885
     *
     * @returns {number}
     */
    get timeUTC(){
        return Math.floor( new Date().getTime() / 1000);
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


    _initializeNewSocket(nodesListObject){

        let socket = nodesListObject.socket;

        socket.node.on("timestamp/request-timeUTC", (data) => {
            this._sendUTC(socket);
        });

    }

    _sendUTC(socket){

        try {
            socket.node.sendRequest("timestamp/request-timeUTC/answer", {
                result: true,
                timeUTC: this.timeUTC
            });

        } catch (exception){
            console.error("error sending the UTC time", exception);
        }

    }


}

export default BlockchainTimestamp;