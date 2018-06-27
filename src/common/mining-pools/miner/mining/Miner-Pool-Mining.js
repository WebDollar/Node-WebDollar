import NodesList from 'node/lists/Nodes-List';
import consts from 'consts/const_global'
import global from 'consts/global';
import Blockchain from "main-blockchain/Blockchain";

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

        this.minerAddress = Blockchain.blockchain.mining.minerAddress;

        setTimeout( this._checkForWork.bind(this), 5000);

    }

    updatePoolMiningWork(work, poolSocket){

        this._miningWork.block = work.block;

        this._miningWork.height = work.h;
        this._miningWork.difficultyTarget = work.t;
        this._miningWork.serializedHeader = work.s;

        Blockchain.blockchain.blocks.length = work.h;


        this._miningWork.start = work.start;
        this._miningWork.end = work.end;

        this._miningWork.resolved = false;

        this._miningWork.poolSocket = poolSocket;

    }

    async mineNextBlock(showMiningOutput, suspend){

        while (this.started && !global.TERMINATED){

            if (showMiningOutput)
                this.setMiningHashRateInterval();

            if (this._miningWork.block === undefined || this._miningWork.resolved)
                await Blockchain.blockchain.sleep(5);
            else {

                try {

                    let timeInitial = new Date().getTime();
                    let answer = await this._run();

                    answer.timeDiff = new Date().getTime() - timeInitial;

                    this._miningWork.resolved = true;

                    let answerPool = await this.minerPoolManagement.minerPoolProtocol.pushWork(this._miningWork.poolSocket, answer);

                } catch (exception) {
                    console.log("Pool Mining Exception", exception);
                    this.stopMining();
                }

            }


        }

    }

    async _run() {

        try {

            if (this._miningWork.block === undefined) throw {message: "block is undefined"};
            if (this._miningWork.start === undefined) throw {message: "start is undefined"};
            if (this._miningWork.end === undefined) throw {message: "end is undefined"};
            if (this._miningWork.difficultyTarget === undefined) throw {message: "difficultyTarget is undefined"};

            let answer = await this.mine(this._miningWork.block, this._miningWork.difficultyTarget, this._miningWork.start, this._miningWork.end, this._miningWork.difficultyTarget );

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