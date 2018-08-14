import PoolWorkValidation from "./Pool-Work-Validation";

class PoolWorkSharesValidation extends PoolWorkValidation{

    constructor(poolManagement, poolWorkManagement){

        super(poolManagement, poolWorkManagement);

        this.shares = [];

    }


    /**
     * It will validate
     * @private
     */
    _validateShares(){



    }


}

export default PoolWorkSharesValidation;