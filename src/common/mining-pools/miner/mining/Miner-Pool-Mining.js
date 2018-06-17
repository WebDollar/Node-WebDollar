import NodesList from 'node/lists/Nodes-List';

let InheritedPoolMining;


if (process.env.BROWSER){
    InheritedPoolMining = require('./browser/Interface-Pool-Browser-Mining').default;
}  else {
    InheritedPoolMining = require('./backbone/Interface-Pool-Backbone-Mining').default;
}


class MinerPoolMining extends InheritedPoolMining {

    constructor(minerPoolManagement) {

        super();

        this.minerPoolManagement = minerPoolManagement;

        this._miningWork = {
            block: undefined,
            noncesStart: undefined,
            noncesEnd: undefined,
            poolSocket: undefined,
        };

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            if (nodesListObject.socket === this._miningWork.poolSocket)
                this._miningWork.poolSocket = null;
        });


        setTimeout( this._checkForWork.bind(this), 5000);

    }

    updatePoolMiningWork(work, poolSocket){

        this._miningWork = work;
        this._miningWork.poolSocket = poolSocket;

    }

    async run() {

        try {

            if (this._miningWork.block === undefined) throw {message: "block is undefined"};
            if (this._miningWork.noncesStart === undefined) throw {message: "noncesStart is undefined"};
            if (this._miningWork.noncesEnd === undefined) throw {message: "noncesEnd is undefined"};

            let answer = await this.mine(this._miningWork.blockData, this._miningWork.difficultyTarget);
            return answer;

        } catch (exception){
            console.error("Couldn't mine block ", this._miningWork.blockData, exception);
            return null;
        }

    }

    async _checkForWork(){

        try {

            if (this._miningWork.poolSocket !== null)
                await this.minerPoolManagement.minerPoolProtocol.requestWork();

        } catch (exception){

        }


        setTimeout( this._checkForWork.bind(this), 5000);
    }

}

export default MinerPoolMining;