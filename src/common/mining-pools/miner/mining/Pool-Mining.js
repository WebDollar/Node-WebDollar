let InheritedPoolMining;


if (process.env.BROWSER){
    InheritedPoolMining = require('./browser/Interface-Pool-Browser-Mining').default;
}  else {
    InheritedPoolMining = require('./backbone/Interface-Pool-Backbone-Mining').default;
}


class PoolMining extends InheritedPoolMining {

    constructor() {

        super();

    }
}

export default PoolMining;