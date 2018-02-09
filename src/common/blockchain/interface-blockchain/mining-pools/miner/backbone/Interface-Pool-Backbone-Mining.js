import InterfaceBlockchainBackboneMining from "common/blockchain/interface-blockchain/mining/backbone/Interface-Blockchain-Backbone-Mining";

class InterfacePoolBackboneMining extends InterfaceBlockchainBackboneMining {

    constructor() {

        super();

    }

    mine(difficultyTarget){

        this.difficulty = difficultyTarget;

        let promiseResolve = new Promise ( (resolve) => {


            this._workerResolve = resolve;
            setTimeout(async () => {return await this.mineNonces() }, 10);


        } );

        return promiseResolve;

    }
}

export default InterfacePoolBackboneMining;