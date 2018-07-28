import NodesList from 'node/lists/Nodes-List';
import consts from 'consts/const_global'
import global from 'consts/global';
import Blockchain from "main-blockchain/Blockchain";
import AdvancedMessages from "node/menu/Advanced-Messages"
import Log from 'common/utils/logging/Log';

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

        this._minerAddress = Blockchain.blockchain.mining.minerAddress;
        this._unencodedMinerAddress = Blockchain.blockchain.mining.unencodedMinerAddress;

        this._isBeingMining = false;

        if (this._workers !== undefined)
            this._workers._in_pool = true;

    }

    _startMinerPoolMining(){

        if (this._checkForWorkInterval === undefined)
            this._checkForWorkInterval = this._checkForWorkIntervalCallback();

        this._miningWork.date = new Date().getTime();

    }

    _stopMinerPoolMining(){

        clearTimeout(this._checkForWorkInterval);
        this._checkForWorkInterval = undefined;

    }

    async _setAddress(newAddress, save, skipChangingAddress=false ){

        if (this._minerAddress === newAddress)
            return;

        let oldMinerAddress = this._minerAddress;
        await InheritedPoolMining.prototype._setAddress.call( this, newAddress, true );

        if (skipChangingAddress) return;

        if ( Blockchain.Wallet.getAddress( this._minerAddress )  === null ){

            //the address is not right, let's ask if he wants to change the mining address
            if (await AdvancedMessages.confirm("You are mining on a different address in this pool. Do you want to change the pool mining address"))
                await this.minerPoolManagement.minerPoolProtocol.changeWalletMining();

        } else
            await this.minerPoolManagement.minerPoolProtocol.changeWalletMining(undefined, this._minerAddress, oldMinerAddress);


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
        this._miningWork.date = new Date().getTime();

        this._miningWork.poolSocket = poolSocket;

        if (this._isBeingMining){
            this.resetForced = true;
        }

        Log.info("New Work: "+ work.start + " : " + work.end, Log.LOG_TYPE.POOLS );

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

                    this._isBeingMining = true;
                    let answer = await this._run();
                    this._isBeingMining = false;

                    if (answer === null)
                        continue;

                    answer.timeDiff = new Date().getTime() - timeInitial;

                    if (!this.resetForced ) {
                        this._miningWork.resolved = true;
                        await this.minerPoolManagement.minerPoolProtocol.pushWork( answer, this._miningWork.poolSocket);
                    } else {
                        this.resetForced = false;
                    }

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

            let answer = await this.mine(this._miningWork.block, this._miningWork.difficultyTarget, this._miningWork.start, this._miningWork.end, this._miningWork.height,  );

            return answer;

        } catch (exception){
            console.error("Couldn't mine block ", this._miningWork, exception);
            return null;
        }

    }


    async _checkForWorkIntervalCallback(){

        try {

            if (this._miningWork.poolSocket !== null && this._miningWork.resolved)
                await this.minerPoolManagement.minerPoolProtocol.requestWork();

            if (this.started && (new Date().getTime() - this._miningWork.date ) > 80000 ){

                //in case I can not mine from this pool, show an error and disconnect
                Log.error("Mining Pool is not working. Trying to reconnect", Log.LOG_TYPE.POOLS);
                NodesList.disconnectAllNodes();
                await this.minerPoolManagement.minerPoolProtocol.insertServersListWaitlist( this.minerPoolSettings.poolServers );

            }

        } catch (exception){

        }

        this._checkForWorkInterval = setTimeout( this._checkForWorkIntervalCallback.bind(this), 5000);

    }

}

export default MinerPoolMining;