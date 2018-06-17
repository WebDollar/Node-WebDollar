import NodesList from 'node/lists/Nodes-List';

let InheritedPoolMining;


if (process.env.BROWSER){
    InheritedPoolMining = require('./browser/Pool-Browser-Mining').default;
}  else {
    InheritedPoolMining = require('./backbone/Pool-Backbone-Mining').default;
}


class MinerPoolMining extends InheritedPoolMining {

    constructor(minerPoolManagement) {

        super();

        this.minerPoolManagement = minerPoolManagement;

        this._miningWork = {
            block: undefined, //entire serialization
            start: undefined,
            end: undefined,
            height: undefined, //number
            difficultyTarget: undefined, //Buffer
            serializedHeader: undefined, //Buffer not used because the block is the entire serialization

            resolved: true,
            poolSocket: undefined,
        };

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            if (nodesListObject.socket === this._miningWork.poolSocket)
                this._miningWork.poolSocket = null;
        });


        setTimeout( this._checkForWork.bind(this), 5000);

    }

    updatePoolMiningWork(work, poolSocket){

        this._miningWork.block = work.block;

        this._miningWork.height = work.h;
        this._miningWork.difficultyTarget = work.t;
        this._miningWork.serializedHeader = work.s;


        this._miningWork.start = work.start;
        this._miningWork.end = work.end;

        this._miningWork.resolved = false;

        this._miningWork.poolSocket = poolSocket;

    }

    async run() {

        try {

            if (this._miningWork.block === undefined) throw {message: "block is undefined"};

            if (this._miningWork.start === undefined) throw {message: "start is undefined"};
            if (this._miningWork.end === undefined) throw {message: "end is undefined"};
            if (this._miningWork.difficultyTarget === undefined) throw {message: "difficultyTarget is undefined"};

            let answer = await this.mine(this._miningWork.blockData, this._miningWork.difficultyTarget);
            return answer;

        } catch (exception){
            console.error("Couldn't mine block ", this._miningWork, exception);
            return null;
        }

    }

    async _checkForWork(){

        try {

            if (this._miningWork.poolSocket !== null && this._miningWork.resolved)
                await this.minerPoolManagement.minerPoolProtocol.requestWork();

        } catch (exception){

        }


        setTimeout( this._checkForWork.bind(this), 5000);
    }

}

export default MinerPoolMining;