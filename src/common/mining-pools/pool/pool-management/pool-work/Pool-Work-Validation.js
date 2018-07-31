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

    pushWorkForValidation(minerInstance, work, ){
        this._works.push({
            work: work,
            minerInstance: minerInstance
        });
    }

    processPoolWorkValidation(){

        try{

            let n = Math.min(PROCESS_COUNT, this._works.length);
            for (let i=0; i<n; i++){

            }

            this._works.splice(0, PROCESS_COUNT);

        }catch (exception){

        }

        this._timeoutPoolWorkValidation = setTimeout( this.processPoolWorkValidation.bind(this), 100 );

    }

}

export default PoolWorkValidation