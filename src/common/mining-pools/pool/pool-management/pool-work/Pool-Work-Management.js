import BufferExtended from "common/utils/BufferExtended";

import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import PoolWork from "./Pool-Work";
import StatusEvents from "common/events/Status-Events";
import PoolNewWorkManagement from "./Pool-New-Work-Management"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';

import PoolWorkValidation from "./Pool-Work-Validation";

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.poolNewWorkManagement = new PoolNewWorkManagement(poolManagement, this, blockchain);
        this.poolWorkValidation = new PoolWorkValidation(poolManagement, this);

        this.poolWork = new PoolWork(poolManagement, blockchain);
    }

    startPoolWorkManagement(){
        this.poolWork.startGarbageCollector();
        this.poolWorkValidation.startPoolWorkValidation();
    }

    stopPoolWorkManagement(){
        this.poolWorkValidation.stopPoolWorkValidation();
        this.poolWork.stopGarbageCollector();
    }


    async getWork(minerInstance,  blockInformationMinerInstance){

        if ( !minerInstance ) throw {message: "minerInstance is undefined"};

        let hashes = minerInstance.hashesPerSecond;
        if ( !hashes ) hashes = 500;

        if ( !blockInformationMinerInstance )
            blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

        await this.poolWork.lastBlockPromise; //it's a promise, let's wait

        //if ( !this.poolWork.lastBlock || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  || ( this.poolWork.lastBlock.timeStamp + BlockchainGenesis.timeStampOffset < (new Date().getTime()/1000 - 300) ) )
        if ( !this.poolWork.lastBlock || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  )
            await this.poolWork.getNextBlockForWork();
        else if (!this.blockchain.semaphoreProcessing.processing && ( this.poolWork.lastBlock.height !==  this.blockchain.blocks.length || !this.poolWork.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash )))
            await this.poolWork.getNextBlockForWork();

        this.poolWork.lastBlockElement.instances[minerInstance.socket.node.sckAddress.uuid] = this.poolWork.lastBlock;

        //for proof of stake it is necessary to know exactly the balance
        let balances;

        let isPOS = BlockchainGenesis.isPoSActivated(this.poolWork.lastBlock.height );

        if (isPOS){

            balances = [];

            for (let i=0; i < minerInstance.addresses.length; i++)
                balances.push(this._getMinerBalance( minerInstance.addresses[i] ));

        }


        let answer = {

            h: this.poolWork.lastBlock.height,
            t: this.poolWork.lastBlock.difficultyTargetPrev,
            s: this.poolWork.lastBlockSerialization,
            I: this.poolWork.lastBlockId,
            m: this.blockchain.blocks.timestampBlocks.getMedianTimestamp( this.poolWork.lastBlock.height, this.poolWork.lastBlock.blockValidation),

            start: isPOS ? 0 : this.poolWork.lastBlockNonce,
            end: isPOS ? 0 : (this.poolWork.lastBlockNonce + hashes),

            b: isPOS ? balances : undefined,

        };

        this.poolWork.lastBlockNonce += hashes;

        minerInstance.lastBlockInformation =  blockInformationMinerInstance;
        minerInstance.workBlock =  this.poolWork.lastBlock;
        minerInstance.dateActivity = new Date().getTime()/1000;

        blockInformationMinerInstance.workBlock = this.poolWork.lastBlock;

        if (this.poolManagement.poolSettings.poolUseSignatures) {

            let message = Buffer.concat( [ this.poolWork.lastBlockSerialization, Serialization.serializeNumber4Bytes(answer.start), Serialization.serializeNumber4Bytes(answer.end) ]);
            answer.sig = this.poolManagement.poolSettings.poolDigitalSign(message);

        }


        return answer;

    }

    async processWork(minerInstance, work, prevBlock){

        let result = false;

        try{

            if ( !minerInstance ) throw {message: "minerInstance is undefined"};
            if ( !work || typeof work !== "object") throw {message: "work is undefined"};

            if ( !Buffer.isBuffer(work.hash) || work.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw {message: "hash is invalid"};
            if ( typeof work.nonce !== "number" ) throw {message: "nonce is invalid"};

            let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

            prevBlock = prevBlock  || blockInformationMinerInstance.workBlock;

            if ( !prevBlock )
                throw {message: "miner instance - no block"};

            let isPos = BlockchainGenesis.isPoSActivated(prevBlock.height);

            let args = [];
            if ( isPos ) {

                work.nonce = 0;
                work.pos.balance = this._getMinerBalance(work.pos.posMinerAddress, prevBlock );

                args = [  work.pos.timestamp, work.pos.posMinerAddress, work.pos.balance ];

            } else {
                args = [work.nonce];
            }


            //TODO remove !isPOS to throw the error message always
            if ( false === await blockInformationMinerInstance.validateWorkHash.apply( blockInformationMinerInstance, [ prevBlock, work.hash ].concat( args ),  )  )
                if ( !isPos )
                    throw {message: "block was incorrectly mined " + ( isPos ? "pos" : "pow") , work: work };

            if (Math.random() < 0.001)
                console.log("Work: ", work);

            if (isPos) {
                prevBlock.nonce = 0;
                prevBlock.posSignature = work.pos.posSignature;
                prevBlock.posMinerAddress = work.pos.posMinerAddress;
                prevBlock.posMinerPublicKey = work.pos.posMinerPublicKey;
                prevBlock.timeStamp = work.pos.timestamp;
                prevBlock.verifyPOSSignature();
            }

            if ( work.result  ) { //it is a solution and prevBlock is undefined

                let wasBlockMined;

                try {
                    wasBlockMined = await blockInformationMinerInstance.wasBlockMined.apply(blockInformationMinerInstance, [prevBlock].concat(args));
                } catch (exception){
                    wasBlockMined = false;

                    //TODO remove !isPOS to throw the error message always
                    if (!isPos)
                        throw exception;
                }

                if ( wasBlockMined ){

                    console.warn("----------------------------------------------------------------------------");
                    console.warn("----------------------------------------------------------------------------");
                    console.warn("WebDollar Block was mined in Pool 2 ", prevBlock.height, " nonce (", work.nonce + ")", work.hash.toString("hex"), " reward", (prevBlock.reward / WebDollarCoins.WEBD), "WEBD", prevBlock.data.minerAddress.toString("hex"));
                    console.warn("----------------------------------------------------------------------------");
                    console.warn("----------------------------------------------------------------------------");

                    //returning false, because a new fork was changed in the mean while
                    if ( !isPos && this.blockchain.blocks.length-1 > prevBlock.height )
                        throw {message: "pool: block is already too old"};

                    if ( isPos && this.blockchain.blocks.length-3 > prevBlock.height )
                        throw {message: "pool: block is already too old"};

                    prevBlock.hash = work.hash;
                    prevBlock.nonce = work.nonce;

                    if (isPos) {
                        prevBlock.nonce = 0;
                        prevBlock.posSignature = work.pos.posSignature;
                        prevBlock.posMinerAddress = work.pos.posMinerAddress;
                        prevBlock.posMinerPublicKey = work.pos.posMinerPublicKey;
                        prevBlock.timeStamp = work.pos.timestamp;

                        prevBlock._validateBlockTimeStamp();

                    }

                    let revertActions = new RevertActions(this.blockchain);

                    let block;

                    try {

                        let serialization = prevBlock.serializeBlock();
                        block = this.blockchain.blockCreator.createEmptyBlock(prevBlock.height, undefined );
                        block.deserializeBlock(serialization, prevBlock.height, prevBlock.reward,  );

                        let blockInformation = blockInformationMinerInstance.blockInformation;

                        if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(async () => {

                                //returning false, because a new fork was changed in the mean while
                                if (this.blockchain.blocks.length !== block.height)
                                    throw {message: "pool: block is already too old for processing"};

                                return this.blockchain.includeBlockchainBlock(block, false, ["all"], true, revertActions);

                            }) === false) throw {message: "Mining2 returned false"};

                        NodeBlockchainPropagation.propagateLastBlockFast(block);

                        //confirming transactions
                        block.data.transactions.confirmTransactions();


                        try {
                            blockInformation.block = block;
                        } catch (exception){
                            console.error("blockInformation block", exception);
                        }

                        this.poolManagement.poolData.addBlockInformation();


                        blockInformationMinerInstance.poolWork = Buffer.from("00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","hex");
                        blockInformationMinerInstance.poolWorkNonce = -1;

                        StatusEvents.emit("blockchain/new-blocks", { });

                    } catch (exception){

                        console.error("PoolWork include raised an exception", exception);
                        revertActions.revertOperations();

                        if (block)
                            block.destroyBlock();

                        //it is an invalid block, let's generate a new one
                        if (this.blockchain.blocks.length-1 === prevBlock.height)
                            await this.poolWork.getNextBlockForWork();



                    }

                    revertActions.destroyRevertActions();

                }


            } else {

                if (consts.DEBUG)
                    console.log("valid work, but not solution", prevBlock.height, work.pos ? work.pos.balance : '' );

            }

            let workDone, storeDifficulty;

            if (isPos) workDone = work.pos.balance;
            else workDone = work.hash;

            //for testing only
            if (!consts.MINING_POOL.SKIP_POS_REWARDS && isPos) storeDifficulty = true;
            else if ( !consts.MINING_POOL.SKIP_POW_REWARDS && !isPos ) storeDifficulty = true;

            if (storeDifficulty) {

                let difficulty = blockInformationMinerInstance.calculateDifficulty( prevBlock, workDone );

                blockInformationMinerInstance.adjustDifficulty( prevBlock, difficulty, true);

                //be sure that none of the POS blocks were skipped
                for (let i = Math.max( prevBlock.height - 5,  this.blockchain.blocks.blocksStartingPoint ); i < prevBlock.height + 5; i++)
                    if ( BlockchainGenesis.isPoSActivated(i) )
                        blockInformationMinerInstance.adjustDifficulty({height: i}, difficulty, true);

                //statistics
                this.poolManagement.poolStatistics.addStatistics( difficulty, minerInstance );

            }

            result = true;

        } catch (exception){

            if (exception.message === "block was incorrectly mined" && Math.random() < 0.3 )
                console.error("Pool Work Management raised an error", exception);
            else if (Math.random() < 0.05 )
                console.error("error pool mining", exception)

        }

        return {result: result, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal, refReward: minerInstance.miner.referrals.rewardReferralsTotal, refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed  }

    }


    _getMinerBalance(address, prevBlock){

        prevBlock = prevBlock || this.poolWork.lastBlock;

        let balance = this.blockchain.accountantTree.getBalance( address );
        if ( !balance ) balance = 0;

        //must be reverted
        //console.log("2 Before Balance ", balance); let s = "";
        for (let i = prevBlock.height-1; i >= 0 && i >= prevBlock.height -1 - consts.BLOCKCHAIN.POS.MINIMUM_POS_TRANSFERS; i--  ) {

            let block = this.blockchain.blocks[ i ];
            if (!block) continue;

            //s += block.height + " ";

            block.data.transactions.transactions.forEach( (tx) => {
                tx.to.addresses.forEach((to)=>{
                    if ( to.unencodedAddress.equals( address))
                        balance -= to.amount;
                });
            });
        }

        //console.log("2 After Balance ", balance, s);

        return balance;

    }

}

export default PoolWorkManagement;