

class WebDollarCoins{

    constructor(){

        this.MAX_SAFE_COINS = Number.MAX_SAFE_INTEGER;
        this.MIN_SAFE_COINS = Number.MIN_SAFE_INTEGER;

    }


    validateCoinsNumber(number){

        if (number === undefined || number === null) return false;

        if (!Number.isInteger(number)) return false;
        if ( number > this.MAX_SAFE_COINS) return false;
        if ( number < this.MIN_SAFE_COINS) return false;

        return true;
    }


}

export default new WebDollarCoins()