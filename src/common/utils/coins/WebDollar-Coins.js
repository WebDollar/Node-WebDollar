

class WebDollarCoins{

    constructor(){

        this.MAX_SAFE_COINS = Number.MAX_SAFE_INTEGER;
        this.MIN_SAFE_COINS = Number.MIN_SAFE_INTEGER;


        //max safe int:     90071992547 40992
        //rewards           41000000000.00000

        this.WEBD = 10000;
        this.UNIT = 1;
    }


    validateCoinsNumber(number){

        if (number === undefined || number === null) return false;

        if (!Number.isInteger(number)) return false;
        if ( number > this.MAX_SAFE_COINS) return false;
        if ( number < this.MIN_SAFE_COINS) return false;

        return true;
    }

    convertToUnits(number){
        return number * this.WEBD;
    }

    convertToWEBD(number){
        return number / this.WEBD;
    }

}

export default new WebDollarCoins()