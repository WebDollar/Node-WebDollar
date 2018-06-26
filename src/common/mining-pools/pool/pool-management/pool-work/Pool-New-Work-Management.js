import StatusEvents from "common/events/Status-Events";
import NodesList from 'node/lists/Nodes-List'

class PoolNewWorkManagement{

    constructor(poolManagement){

        this.poolManagement = poolManagement;


        this._payoutInProgress = false;

        this.isBeingPropagating = false;

        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            if (!this.poolManagement._poolStarted) return;

            if (this.isBeingPropagating ) return;

            this.isBeingPropagating = true;
            try {
                await this.propagateNewWork();
            } catch (exception){

            }
            this.isBeingPropagating = false;

        });


    }


    async propagateNewWork(){

        let lastBlockInformation = this.poolManagement.poolData.lastBlockInformation;

        //if it is the same block
        if (lastBlockInformation.block === this.poolManagement.blockchain.blocks.last) return;

        for (let i=0; i<lastBlockInformation.blockInformationMinersInstances.length; i++){

            let minerInstance = lastBlockInformation.blockInformationMinersInstances[i];

            let work = this.poolManagement.poolWorkManagement.getWork(minerInstance);

            let answer = await this._sendNewWork( minerInstance.socket, work );

        }

    }

    async _sendNewWork(socket, work){

        let answer = await socket.sendRequestWaitOnce("mining-pool/new-work",{});

    }


}

export default PoolNewWorkManagement;