import Log from 'common/utils/logging/Log';
const PROCESS_COUNT = 30;
import consts from 'consts/const_global';

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class PoolWorkValidation{

    constructor(poolManagement, poolWorkManagement){

        this.poolManagement = poolManagement;
        this.poolWorkManagement = poolWorkManagement;

        this._works = [];
    }

    startPoolWorkValidation(){

        if ( !this._timeoutPoolWorkValidation )
            this._timeoutPoolWorkValidation = setTimeout( this.processPoolWorkValidation.bind(this), 100 );

    }

    stopPoolWorkValidation(){
        clearTimeout(this._timeoutPoolWorkValidation);
    }

    async pushWorkForValidation(minerInstance, work, forced ){

        try{

            if (typeof work.timeDiff === "number") {

                let hashesFactor = Math.max(0.5, Math.min(2, ( 80000 / work.timeDiff ))); //80 sec

                let hashesPerSecond = Math.floor( minerInstance.hashesPerSecond * hashesFactor);
                minerInstance.hashesPerSecond = Math.max( 100, Math.min( hashesPerSecond, 3000000 ));
                minerInstance.realHashesPerSecond = Math.floor(work.hashes / work.timeDiff * 1000);

            }

            minerInstance.dateActivity = new Date().getTime() / 1000;

            let workData = {
                work: work,
                minerInstance: minerInstance
            };

            if (BlockchainGenesis.isPoSActivated(work.h))
                forced = true;

            if (work.result || forced  ){

                await this._validateWork(workData);

            } else {

                if (!BlockchainGenesis.isPoSActivated(work.h) && work.hash.equals( consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER ))
                    return;

                this._works.push(workData);
            }

        }catch (exception){

        }


    }

    async processPoolWorkValidation(){

        Log.info("Total amount of work to validate: "+this._works.length, Log.LOG_TYPE.POOLS );

        if (this.poolManagement.blockchain.semaphoreProcessing._list.length === 0 ) {

            let index = -1;

            let n = Math.min(PROCESS_COUNT, this._works.length);

            for (let i = 0; i < n; i++) {

                try {
                    await this._validateWork(this._works[i]);
                } catch (exception){

                }

                index = i;
            }


            if (index >= 0)
                this._works.splice(0, index);

        }

        this._timeoutPoolWorkValidation = setTimeout( this.processPoolWorkValidation.bind(this), Math.max( 100, Math.min(10000, 50000/this._works.length)) );

    }

    async _validateWork(work){

        let prevBlock = this.poolWorkManagement.poolWork.findBlockById( work.work.id, work.work.height );

        if ( prevBlock )
            await this.poolWorkManagement.processWork( work.minerInstance, work.work, prevBlock );
        else
            Log.error("_validateWork didn't work as the block " + work.work.id + " was not found", Log.LOG_TYPE.POOLS, work.work );

    }

}

export default PoolWorkValidation
