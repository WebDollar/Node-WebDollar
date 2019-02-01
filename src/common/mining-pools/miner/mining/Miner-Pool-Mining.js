import NodesList from 'node/lists/Nodes-List';
import consts from 'consts/const_global'
import global from 'consts/global';
import Blockchain from "main-blockchain/Blockchain";
import AdvancedMessages from "node/menu/Advanced-Messages"
import Log from 'common/utils/logging/Log';
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import InterfaceBlockchainBlockCreator from "../../../blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

let InheritedPoolMining;


if (process.env.BROWSER){
    InheritedPoolMining = require('./browser/Pool-Browser-Mining').default;
}  else {
    InheritedPoolMining = require('./backbone/Pool-Backbone-Mining').default;
}


class MinerPoolMining extends InheritedPoolMining {

    constructor(minerPoolManagement) {

        super(minerPoolManagement.blockchain);

        this.minerPoolManagement = minerPoolManagement;

        this._miningWork = {
            block: undefined, //entire serialization
            blockId: -1,

            start: undefined,
            end: undefined,
            height: undefined, //number
            difficultyTarget: undefined, //Buffer
            serializedHeader: undefined, //Buffer not used because the block is the entire serialization

            resolved: true,
            poolSock1et: undefined,

            blocks: [],
        };

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            if (nodesListObject.socket === this._miningWork.poolSocket)
                this._miningWork.poolSocket = null;
        });

        this._minerAddress = Blockchain.blockchain.mining.minerAddress;
        this._unencodedMinerAddress = Blockchain.blockchain.mining.unencodedMinerAddress;

        this._isBeingMining = undefined;

        if (this._workers)
            this._workers._in_pool = true;

        this._miningBalances = {};

    }

    _startMinerPoolMining(){

        if ( !this._checkForWorkInterval )
            this._checkForWorkInterval = this._checkForWorkIntervalCallback();

        this._miningWork.date = new Date().getTime();

    }

    _stopMinerPoolMining(){

        clearTimeout(this._checkForWorkInterval);

        this.started = false;
        this._checkForWorkInterval = undefined;

        InheritedPoolMining.prototype.stopMining.call(this);

    }

    getMedianTimestamp(){
        return this._miningWork.medianTimestamp;
    }

    async _setAddress(newAddress, save , skipChangingAddress=false ){

        await InheritedPoolMining.prototype._setAddress.call( this, newAddress, save);

        if (this._minerAddress === newAddress)
            return;

        let oldMinerAddress = this._minerAddress;

        if (skipChangingAddress) return;

        if ( Blockchain.Wallet.getAddress( this._minerAddress )  === null ){

            //the address is not right, let's ask if he wants to change the mining address
            if (await AdvancedMessages.confirm("You are mining on a different address in this pool. Do you want to change the pool mining address"))
                await this.minerPoolManagement.minerPoolProtocol.changeWalletMining();

        } else
            await this.minerPoolManagement.minerPoolProtocol.changeWalletMining(undefined, this._minerAddress, oldMinerAddress);


    }

    updatePoolMiningWork(work, poolSocket){

        //update manually the balances
        if (work.b && work.b.length === Blockchain.Wallet.addresses.length){

            for (let i=0 ; i< work.b.length; i++)
                this._miningBalances[ Blockchain.Wallet.addresses[i].unencodedAddress.toString("hex") ] = work.b[i];

        }

        let block = new this.blockchain.blockCreator.blockClass( this.blockchain, undefined, 0, new Buffer(32), new Buffer(32), new Buffer(32), 0, 0, undefined, work.h,   );
        block.deserializeBlock( work.block, work.h, undefined, work.t, undefined, undefined, true, true );

        //required data
        if (BlockchainGenesis.isPoSActivated(work.h))
            block.posMinerAddress = Blockchain.Mining.unencodedMinerAddress;

        this._miningWork.blocks.push(block);

        this._miningWork.block = block;
        this._miningWork.blockSerialized = work.block;

        this._miningWork.medianTimestamp = work.m;

        this._miningWork.height = work.h;
        this._miningWork.blockId = work.I||work.h;

        this._miningWork.blockLastSignature = work.lsig || new Buffer(0 );

        this._miningWork.difficultyTarget = work.t;
        this._miningWork.serializedHeader = work.s;

        Blockchain.blockchain.blocks.length = work.h;
        Blockchain.blockchain.blocks.emitBlockCountChanged();

        this._miningWork.start = work.start;
        this._miningWork.end = work.end;

        this._miningWork.date = new Date().getTime();

        this._miningWork.poolSocket = poolSocket;
        this._miningWork.resolved = false;

        this.minerPoolManagement.minerPoolMining.resetForced = false;

        Log.info("New Work: "+ (work.end - work.start) + "   starting at: "+work.start + " block: "+this._getBlockSuffix(), Log.LOG_TYPE.POOLS );

    }

    _getBlockSuffix(){
        return BufferExtended.substr(this._miningWork.serializedHeader, 10 , 26).toString("hex")
    }


    async mineNextBlock(suspend){

        while (this.started && !global.TERMINATED){

            if ( !this._miningWork.block || this._miningWork.resolved)
                await Blockchain.blockchain.sleep(5);
            else {

                try {

                    //except the last block
                    if (this.block){
                        for ( let i=this._miningWork.blocks.length-2; i >= 0; i-- )
                            if ( this._miningWork.blocks[i].height  < this.block.height  ){
                                this._miningWork.blocks[i].destroyBlock();
                                this._miningWork.blocks.splice(i, 1);
                            }

                        let prevBlock = this.block;

                        if (prevBlock && prevBlock !== this._miningWork.block )
                            prevBlock.destroyBlock();
                    }

                    let timeInitial = new Date().getTime();

                    this._isBeingMining = new Promise( async (resolve)=>{

                        try {

                            let workHeight = this._miningWork.height;
                            let workId = this._miningWork.blockId;
                            let workEnd = this._miningWork.end;
                            let workStart = this._miningWork.start;

                            let answer = await this._run();

                            if (!answer)  answer = {
                                hash: consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER,
                                nonce: 0,
                            };

                            answer.timeDiff = new Date().getTime() - timeInitial;
                            answer.id = workId;
                            answer.h = workHeight;

                            if (!this._miningWork.resolved)
                                answer.hashes = workEnd - workStart;

                            this.minerPoolManagement.minerPoolProtocol.pushWork( answer, this._miningWork.poolSocket );

                            this.resetForced = false;
                            this._miningWork.resolved = true;

                        } catch (exception){
                            console.log("Pool Mining Exception", exception);
                            this.stopMining();

                        }

                        resolve(true);

                    });

                    await this._isBeingMining;

                } catch (exception) {
                }

            }

        }

    }

    async _run() {

        this._runningPromise = new Promise( async (resolve)=>{

            try {

                if (this._miningWork.block === undefined) throw {message: "block is undefined"};
                if (this._miningWork.start === undefined) throw {message: "start is undefined"};
                if (this._miningWork.end === undefined) throw {message: "end is undefined"};
                if (this._miningWork.difficultyTarget === undefined) throw {message: "difficultyTarget is undefined"};

                let answer = await this.mine (this._miningWork.block, this._miningWork.difficultyTarget, this._miningWork.start, this._miningWork.end, this._miningWork.height,  );

                resolve(answer);


            } catch (exception){

                console.error("Couldn't mine block ", this._miningWork.block.toJSON(), exception);
                resolve(null);

            }


        });

        return this._runningPromise;


    }


    async _checkForWorkIntervalCallback(){

        try {

            if ( this._miningWork.poolSocket && this._hashesPerSecond === 0 )
                await this.minerPoolManagement.minerPoolProtocol.requestWork();

            if (this.started && this.minerPoolManagement.started && ( (new Date().getTime() - this._miningWork.date ) > 180000 || this.minerPoolManagement.minerPoolProtocol.connectedPools.length === 0 ) ){

                //in case I can not mine from this pool, show an error and disconnect
                Log.error("Mining Pool is not working. Trying to reconnect", Log.LOG_TYPE.POOLS);
                NodesList.disconnectAllNodes();
                await this.minerPoolManagement.minerPoolProtocol.insertServersListWaitlist( this.minerPoolSettings.poolServers );

                this._miningWork.date = new Date().getTime();

            }

        } catch (exception){

        }

        this._checkForWorkInterval = setTimeout( this._checkForWorkIntervalCallback.bind(this), 5000 );

    }

}

export default MinerPoolMining;