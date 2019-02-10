import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import NodesList from 'node/lists/Nodes-List'
import Log from 'common/utils/logging/Log';

class PoolDataConnectedMinerInstances extends PoolProtocolList{

    constructor(poolManagement){

        super();

        this.poolManagement = poolManagement;
        this.connectedMinerInstances = this.list;

    }


    startPoolDataConnectedMinerInstances(){

        if (!this._deleteUnresponsiveMinersInterval )
            this._deleteUnresponsiveMinersInterval = setTimeout( this._deleteUnresponsiveMiners.bind(this), 20000 );

    }

    stopPoolDataConnectedMinerInstances(){

        clearTimeout(this._deleteUnresponsiveMinersInterval);
        this._deleteUnresponsiveMinersInterval = undefined;

    }

    async _deleteUnresponsiveMiners(){

        let count = 0;

        try{

            let time = new Date().getTime()/1000;

            for (let i = this.connectedMinerInstances.length - 1; i >= 0; i--) {

                if ( !this.connectedMinerInstances[i] || !this.connectedMinerInstances[i].socket || this.connectedMinerInstances[i].socket.disconnected )
                    this.connectedMinerInstances.splice(i, 1);
                else
                if ( time - this.connectedMinerInstances[i].dateActivity > 480 ) { //8 minutes

                    try {

                        let socket = this.connectedMinerInstances[i].socket;

                        if ( !this.poolManagement.poolSettings.poolUsePoolServers ) {
                            Log.info("Socket was disconnected for not having activity: " + time - this.connectedMinerInstances[i].dateActivity, Log.LOG_TYPE.POOLS);
                            this.connectedMinerInstances[i].socket.disconnect();
                        }

                        if (this.connectedMinerInstances[i] && socket === this.connectedMinerInstances[i].socket)
                            this.connectedMinerInstances.splice(i, 1);

                        count ++;

                        if (count % 20 === 0) {
                            await this.poolManagement.blockchain.sleep(500);
                            Log.info("_deleteUnresponsiveMiners batch disconnected", Log.LOG_TYPE.POOLS, count );
                        }

                    } catch (exception) {
                        Log.error("_deleteUnresponsiveMiners raised an error", Log.LOG_TYPE.POOLS, exception);
                    }

                }
            }

        }catch(err){

        }

        setTimeout( this._deleteUnresponsiveMiners.bind(this), 20000 );
    }

    findElement(socket){

        for (let i=0; i<this.list.length; i++)
            if (this.list[i].socket === socket || this.list[i] === socket  )
                return i;

        return -1;

    }

    deleteElement(socket){

        for (let i=this.list.length-1; i>= 0; i--)
            if (this.list[i].socket === socket || this.list[i] === socket  )
                this.list.splice(i,1);


    }


}

export default PoolDataConnectedMinerInstances