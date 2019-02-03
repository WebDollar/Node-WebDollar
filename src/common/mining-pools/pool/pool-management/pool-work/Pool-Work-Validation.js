import Log from 'common/utils/logging/Log';
const PROCESS_COUNT = 30;
import consts from 'consts/const_global';

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class PoolWorkValidation{

    constructor(poolManagement, poolWorkManagement){

        this.poolManagement = poolManagement;
        this.poolWorkManagement = poolWorkManagement;

        this._works = {};
        this._worksLength = 0;

        this._worksDuplicate =  {};

    }

    startPoolWorkValidation(){

        if ( !this._timeoutPoolWorkValidation )
            this._timeoutPoolWorkValidation = setTimeout( this._processPoolWorkValidation.bind(this), 100 );

        if ( !this._intervalPoolWorkDuplicateRemoval )
            this._intervalPoolWorkDuplicateRemoval = setInterval( this._removePoolWorkDuplicates.bind(this), 60*1000 );
    }

    stopPoolWorkValidation(){
        clearTimeout(this._timeoutPoolWorkValidation);
        clearInterval(this._intervalPoolWorkDuplicateRemoval);
    }

    async pushWorkForValidation(minerInstance, work, forced ){

        try{

            if (!work.hash)
                return;

            work.hashHex = work.hash.toString("hex");
            if ( this._worksDuplicate[work.hashHex] )
                return;

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


            if (BlockchainGenesis.isPoSActivated(work.h)) {

                //avoid validating not signed POS
                if ( !work.pos || !work.pos.posSignature )
                    return;

                forced = true;
            }

            this._worksDuplicate [ work.hashHex ] = new Date().getTime();

            if ( work.result || forced  ){

                await this._validateWork(workData);

            } else {

                this.addWork(workData);

            }

        }catch (exception){
            console.log(exception);
        }


    }

    addWork(workData){

        if (!this._works[workData.hashHex]){
            this._works[workData.hashHex] = workData;
            this._worksLength++;
        }

    }

    async _processPoolWorkValidation(){

        Log.info("Total amount of work to validate: "+this._worksLength, Log.LOG_TYPE.POOLS );

        if (this.poolManagement.blockchain.semaphoreProcessing._list.length === 0 ) {

            let index = -1;

            let n = Math.min(PROCESS_COUNT, this._worksLength);

            for (let key in this._works){

                try {
                    await this._validateWork(this._works[i]);
                } catch (exception){

                }

                this._works[key] = undefined;
                delete this._works[key];

                index++;
                if (index > n)
                    break;
            }

            this._worksLength -= n;

        }

        this._timeoutPoolWorkValidation = setTimeout( this._processPoolWorkValidation.bind(this), Math.max( 100, Math.min(10000, this._worksLength ? 50000/this._worksLength : 10000)) );

    }

    async _validateWork(work){

        let prevBlock = this.poolWorkManagement.poolWork.findBlockById( work.work.id, work.work.height );

        if ( prevBlock )
            await this.poolWorkManagement.processWork( work.minerInstance, work.work, prevBlock );
        else
            Log.error("_validateWork didn't work as the block " + work.work.id + " was not found", Log.LOG_TYPE.POOLS, work.work );

    }

    _removePoolWorkDuplicates(){

        try{

            let time = new Date().getTime();

            for (let key in this._worksDuplicate)
                if ( time - this._worksDuplicate[key] > 180000 ){
                    delete this._worksDuplicate[key];
                }

        } catch (exception){

        }

    }

}

export default PoolWorkValidation
