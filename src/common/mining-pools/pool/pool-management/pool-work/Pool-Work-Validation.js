import Log from 'common/utils/logging/Log';
const PROCESS_COUNT = 30;

class PoolWorkValidation{

    constructor(poolManagement, poolWorkManagement){

        this.poolManagement = poolManagement;
        this.poolWorkManagement = poolWorkManagement;

        this._works = [];
    }

    startPoolWorkValidation(){

        if (this._timeoutPoolWorkValidation === undefined)
            this._timeoutPoolWorkValidation = setTimeout( this.processPoolWorkValidation.bind(this), 100 );

    }

    stopPoolWorkValidation(){
        clearTimeout(this._timeoutPoolWorkValidation);
    }

    async pushWorkForValidation(minerInstance, work, forced ){

        if (typeof work.timeDiff === "number") {

            let hashesFactor = Math.max(0.5, Math.min(2, ( 80000 / work.timeDiff ))); //80 sec

            let hashesPerSecond = Math.floor( minerInstance.hashesPerSecond * hashesFactor);
            minerInstance.hashesPerSecond = Math.max( 100, Math.min( hashesPerSecond, 3000000 ));

        }

        work = {
            work: work,
            minerInstance: minerInstance
        };


        if (work.work.result || forced){

            await this._validateWork(work);

            return;
        }

        this._works.push(work);

    }

    async processPoolWorkValidation(){

        Log.info("Total amount of work to validate: "+this._works.length, Log.LOG_TYPE.POOLS );

        if (this.poolManagement.blockchain.semaphoreProcessing._list.length === 0 )

            try{

                let n = Math.min(PROCESS_COUNT, this._works.length);

                for (let i=0; i<n; i++){

                    await this._validateWork(this._works[i]);

                }

                this._works.splice(0, PROCESS_COUNT);

            }catch (exception){

            }

        this._timeoutPoolWorkValidation = setTimeout( this.processPoolWorkValidation.bind(this), Math.max( 100, Math.min(10000, 50000/this._works.length)) );

    }

    async _validateWork(work){

        let prevBlock = this.poolWorkManagement.poolWork.findBlockById( work.work.id, work.work.height );

        if (prevBlock !== undefined)
            await this.poolWorkManagement.processWork( work.minerInstance, work.work, prevBlock );

    }

}

export default PoolWorkValidation