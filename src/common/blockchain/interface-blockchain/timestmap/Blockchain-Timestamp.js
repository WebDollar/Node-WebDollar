import BlockchainnetworkTime from "./Blockchain-Network-Adjusted-Time"
import NodesList from 'node/lists/nodes-list'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class BlockchainTimestamp{

    constructor(){

        this.networkAdjustedTime = new BlockchainnetworkTime(this);

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._initializeNewSocket(result)
        });

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


    _initializeNewSocket(nodesListObject){

        let socket = nodesListObject.socket;

        socket.node.on("timestamp/request-timeUTC", (data) => {

            try {

                socket.node.sendRequest("timestamp/request-timeUTC/answer" , {
                    result: true,
                    timeUTC: this.timeUTC
                });

            } catch (exception) {


            }

        });

    }


}

export default BlockchainTimestamp;