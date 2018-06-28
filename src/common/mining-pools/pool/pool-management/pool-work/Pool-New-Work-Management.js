import StatusEvents from "common/events/Status-Events";
import NodesList from 'node/lists/Nodes-List'

class PoolNewWorkManagement{

    constructor(poolManagement){

        this.poolManagement = poolManagement;


        this._payoutInProgress = false;

        this.isBeingPropagating = false;

        StatusEvents.on("blockchain/new-blocks",async (data)=>{

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

        for (let i=0; i<lastBlockInformation.blockInformationMinersInstances.length; i++){

            let blockInformationMinerInstance = lastBlockInformation.blockInformationMinersInstances[i];
            let minerInstance = blockInformationMinerInstance.minerInstance;

            let prevBlock = blockInformationMinerInstance.workBlock;

            let newWork = await this.poolManagement.getWork( minerInstance, true, blockInformationMinerInstance);

            if ( minerInstance.socket !== undefined ) {

                let answer = await this._sendNewWork(minerInstance, newWork);
                if (answer !== false){

                    await this.poolManagement.poolWorkManagement.processWork(minerInstance, answer);
P
                }
            }

        }

    }

    async _sendNewWork(minerInstance, work, ){

        let answer = await minerInstance.socket.sendRequestWaitOnce("mining-pool/new-work", { result: true, newWork: work, minerPublicKey: minerInstance.publicKey, } );

        if ( answer === null || answer.result !== true) return false;

        if (!Buffer.isBuffer(answer.hash ) ) return false;
        if ( typeof answer.nonce !== "number" ) return false;


        return answer;

    }


}

export default PoolNewWorkManagement;