let InterfacePoolMiningWorker;

if (process.env.BROWSER){

    InterfacePoolMiningWorker = require ('./browser/Interface-Pool-Browser-Worker').default;

}  else {

    InterfacePoolMiningWorker = require ('./backbone/Interface-Pool-Backbone-Mining').default;

}

class PoolMiningWorker extends InterfacePoolMiningWorker {

    constructor() {

        super();

    }
}

export default PoolMiningWorker;