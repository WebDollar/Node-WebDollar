let InheritedPoolWorker;


if (process.env.BROWSER){
    InheritedPoolWorker = require('./browser/Interface-Pool-Browser-Worker').default;
}  else {
    InheritedPoolWorker = require('./backbone/Interface-Pool-Backbone-Mining').default;
}


class PoolMiningWorker extends InheritedPoolWorker {

    constructor(miningFeeThreshold) {

        super(miningFeeThreshold);

    }
}

export default PoolMiningWorker;