import StatusEvents from "common/events/Status-Events";
import BufferExtended from 'common/utils/BufferExtended';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import consts from 'consts/const_global'
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"
import PoolPayouts from "./Payout/Pool-Payouts"
import Log from 'common/utils/logging/Log';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import AddressBanList from "common/utils/bans/AddressBanList";

const LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS = 50; //blocks
const VALIDATION_BLOCK_CONFIRMATIONS_FAILS_START = 40; //blocks

const MAXIMUM_FAIL_CONFIRMATIONS = 80; //blocks

const CONFIRMATIONS_REQUIRE_OTHER_MINERS = consts.DEBUG ? false : true;

const CONFIRMATION_METHOD = 2; //1 is not working properly

const CONFIRMATIONS_REQUIRED = consts.DEBUG ? 2 : (CONFIRMATION_METHOD === 2 ? 60 : 10);

import Blockchain from 'main-blockchain/Blockchain';

class PoolRewardsManagement{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;
        this.blockchain = blockchain;

        this.poolPayouts = new PoolPayouts(poolManagement, poolData, blockchain);

        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            if (!this.poolManagement._poolStarted) return;
            if (!Blockchain.loaded) return;

            await this._blockchainChanged();

        });


        this._serverBlocksDifficultyCalculation = {};
        this._serverBlocks = [];
        this._serverBlockInfo = undefined;

        this._lastTimeCheckHeight = 0;
    }

    async _blockchainChanged(){

        if (this.poolData.blocksInfo.length === 0) return;

        if (this.blockchain.blocks.length === 0) return;
        if (!Blockchain.synchronized) return;

        //already checked, or maybe it is a fork
        if (this._lastTimeCheckHeight > this.blockchain.blocks.length-1)
            return;

        this._lastTimeCheckHeight = this.blockchain.blocks.length-1;

        //check for penalties

        let penaltiesMinerInstances = {};
        let penaltiesMinerInstancesCount = 0;

        try{

            for ( let blockInfo of this.poolData.blocksInfo)
                if ( blockInfo.block && BlockchainGenesis.isPoSActivated(blockInfo.block.height) ){

                    let block = await this.blockchain.getBlock ( blockInfo.height );

                    if ( block && blockInfo.height >= this.blockchain.blocks.blocksStartingPoint && this.blockchain.blocks.length >= block.height+5 && this.blockchain.blocks.length-50 <= block.height )
                        for (let blockInformationMinerInstance of blockInfo.blockInformationMinersInstances)
                            if (!blockInformationMinerInstance.penalty){

                                let penalty;

                                if (block.posMinerAddress && block.posMinerAddress.equals(blockInformationMinerInstance.minerAddress) && !block.data.minerAddress.equals(this.blockchain.mining.unencodedMinerAddress))
                                    penalty = true;

                                if (block.data.minerAddress.equals(blockInformationMinerInstance.minerAddress))
                                    penalty = true;

                                if (penalty && !penaltiesMinerInstances[ blockInformationMinerInstance.address.toString("hex") ] ) {

                                    penaltiesMinerInstances[ blockInformationMinerInstance.address.toString("hex") ] = blockInformationMinerInstance.address;
                                    penaltiesMinerInstancesCount++;

                                    console.info("penalty activated", blockInformationMinerInstance.addressWIF );
                                    AddressBanList.addBan(blockInformationMinerInstance.minerInstance.address, 4 * 3600 * 1000, "4 Hours POS Penalty");
                                }

                        }

                }

            //redistribute all pool POS
            if (penaltiesMinerInstancesCount > 0)
                for (let minerAddress in penaltiesMinerInstances)
                    for (let blockInfo of this.poolData.blocksInfo)
                        for (let blockInformationMinerInstance of blockInfo.blockInformationMinersInstances)
                            if ( !blockInformationMinerInstance.penalty && blockInformationMinerInstance.minerAddress.equals( penaltiesMinerInstances[minerAddress] )) {

                                //redistribute all pool POS
                                blockInformationMinerInstance.cancelDifficulties("pos" );
                                blockInformationMinerInstance.cancelReward();

                                blockInformationMinerInstance.penalty = true;

                            }



        } catch (exception){

            console.error("Pool Rewards Redistribution error")

        }

        await this.blockchain.sleep(500);


        let confirmationsPool = 0;
        let confirmationsOthers = 0;
        let confirmationsOthersUnique = 0;
        let found = false;
        let uniques = [];

        let confirmations = {};

        //calculate confirmations
        if (CONFIRMATION_METHOD === 1)
            try {

                let firstBlock;
                for (let blockInfo of this.poolData.blocksInfo)
                    if (blockInfo.block )
                        if ( !firstBlock  || blockInfo.block.height < firstBlock)
                            firstBlock = blockInfo.block.height;

                for (let i = this.blockchain.blocks.length - 1, n = Math.max(this.blockchain.blocks.blocksStartingPoint, firstBlock); i >= n; i--) {

                    let block = await this.blockchain.getBlock(i);
                    if (this.blockchain.mining.unencodedMinerAddress.equals( block.data.minerAddress))
                        confirmationsPool++;
                    else {

                        if ( !uniques[ block.data.minerAddress.toString("hex")] ) {
                            uniques[ block.data.minerAddress.toString("hex")] = true;
                            confirmationsOthersUnique++;
                        } else
                            confirmationsOthers++;
                    }

                    confirmations[i] = {
                        confirmationsPool: confirmationsPool,
                        confirmationsOthers: confirmationsOthers,
                        confirmationsOthersUnique: confirmationsOthersUnique,
                    }

                }

            } catch (exception){

            }

        Log.info("BLocksInfo: "+this.poolData.blocksInfo.length, Log.LOG_TYPE.POOLS );

        let poolBlocksBeingConfirmed = 0;

        let needSave = false;

        //recalculate the confirmations
        for (let i = this.poolData.blocksInfo.length-1; i >= 0; i--  ){

            let blockInfo = this.poolData.blocksInfo[i];

            //already confirmed
            if ( blockInfo.payoutTransaction  ) {

                let found = false;

                //verify if the transaction was included
                //at least 2 confirmations
                if (!blockInfo.payoutTx) found = true;
                else
                for (let i=this.blockchain.blocks.length-1 - 2; i >= Math.max( this.blockchain.blocks.length - 100, this.blockchain.blocks.blocksStartingPoint); i-- ) {

                    let block = await this.blockchain.getBlock( i );
                    if ( block.data.transactions.findTransactionInBlockData(blockInfo.payoutTx) >= 0 ) {
                        found = true;
                        break;
                    }
                }

                //let's delete old payouts
                if (found){
                    blockInfo.payout = true;
                    Log.warn("BLOCK TRANSACTION PAYOUT CONFIRMED "+i, Log.LOG_TYPE.POOLS);
                }

            }

            //already confirmed
            if ( blockInfo.payout){

                //let's delete old payouts
                this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid++;
                this.poolManagement.poolStatistics.poolBlocksConfirmed--;
                Log.warn("BLOCK ALREADY PAID "+i, Log.LOG_TYPE.POOLS);
                this.poolData.deleteBlockInformation(i);
                needSave = true;

                continue;
            }

            //already confirmed
            if (blockInfo.confirmed)
                continue;

            let block = blockInfo.block;

            if ( !block ){

                if (i === this.poolData.blocksInfo.length-1 ) continue;
                else { //for some reasons, maybe save/load
                    
                    Log.warn("==========================================", Log.LOG_TYPE.POOLS);
                    Log.warn("REDISTRIBUTION1 DONE 1 "+i, Log.LOG_TYPE.POOLS);
                    Log.warn("==========================================", Log.LOG_TYPE.POOLS);
                    
                    this.redistributePoolDataBlockInformation(blockInfo, i );
                    continue;
                }

            }


            //not ready at the moment
            if (block.height > this.blockchain.blocks.length) {
                poolBlocksBeingConfirmed++;
                continue;
            }

            //confirm using my own blockchain / light blockchain
            if (this.blockchain.blocks.blocksStartingPoint < block.height){ //i can confirm the block by myself

                let blockckahinBlock = await this.blockchain.getBlock(blockInfo.height);
                if (  !blockckahinBlock ) continue;

                if ( BufferExtended.safeCompare( block.hashChain, blockckahinBlock.hashChain  ) ){

                    found = true;

                    //Method 1
                    //using confirmations as a confirmation system
                    if (CONFIRMATION_METHOD === 1) {

                        let confirmation = confirmations[block.height];
                        blockInfo.confirmations = confirmation.confirmationsOthersUnique + confirmation.confirmationsOthers / 2 + Math.min(confirmation.confirmationsPool / 4, CONFIRMATIONS_REQUIRE_OTHER_MINERS ? 2 : 10000);

                    } else if (CONFIRMATION_METHOD === 2)
                        blockInfo.confirmations = (this.blockchain.blocks.length - block.height);

                    blockInfo.confirmationsFailsTrials = 0;

                } else{

                    if ( this.blockchain.blocks.length  > block.height + VALIDATION_BLOCK_CONFIRMATIONS_FAILS_START )
                        blockInfo.confirmationsFailsTrials++;

                }

            } else { //i can not confirm the block because I am in browser and I need to use the server

                //not enough blocks
                if (block.height < this.blockchain.blocks.length + LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS)
                    continue;

                found = await this._confirmUsingPoolServer(blockInfo);

                if (!found)
                    blockInfo.confirmationsFailsTrials++;

            }

            if (!found)
                blockInfo.confirmations = 0;

            //to mail fail trials
            if ( blockInfo.confirmationsFailsTrials > MAXIMUM_FAIL_CONFIRMATIONS ){

                if (i === this.poolData.blocksInfo.length-1 ) continue;

                this.poolManagement.poolStatistics.poolBlocksUnconfirmed++;

                Log.warn("==========================================", Log.LOG_TYPE.POOLS);
                Log.warn("REDISTRIBUTION1 DONE 2 "+ i, Log.LOG_TYPE.POOLS);
                Log.warn("==========================================", Log.LOG_TYPE.POOLS);

                this.redistributePoolDataBlockInformation(blockInfo, i );
                continue;
            }

            if (found && blockInfo.confirmations > CONFIRMATIONS_REQUIRED){

                blockInfo.confirmed = true;

                //convert reward to confirmedReward
                for (let minerInstance of blockInfo.blockInformationMinersInstances) {

                    minerInstance.calculateReward(false);

                    minerInstance.miner.rewardConfirmed += minerInstance.reward;
                    minerInstance.miner.rewardTotal -= minerInstance.reward;


                    if ( minerInstance.miner.referrals.referralLinkMiner && this.poolManagement.poolSettings.poolReferralFee > 0) {
                        minerInstance.miner.referrals.referralLinkMiner.rewardReferralConfirmed += minerInstance.rewardForReferral;
                        minerInstance.miner.referrals.referralLinkMiner.rewardReferralTotal -= minerInstance.rewardForReferral;
                    }

                }

                this.poolManagement.poolStatistics.poolBlocksConfirmed++;

            } else
                poolBlocksBeingConfirmed++;

            await this.blockchain.sleep(100);
        }

        this.poolManagement.poolStatistics.poolBlocksBeingConfirmed = poolBlocksBeingConfirmed;

        if (needSave)
            await this.poolManagement.poolData.saveBlocksInformation();



    }


    async _confirmUsingPoolServer(blockInfo){

        let found = false;

        if (this.poolManagement.poolProtocol.poolConnectedServersProtocol.connectedServersPools.length === 0) return false;

        let connectedServerPoolIndex = Math.floor( Math.random()* this.poolManagement.poolProtocol.poolConnectedServersProtocol.connectedServersPools.length);
        let connectedServerPool = this.poolManagement.poolProtocol.poolConnectedServersProtocol.connectedServersPools[connectedServerPoolIndex];

        //ask for LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS blocks

        this._serverBlocksDifficultyCalculation = this.blockchain.agent.protocol.forkSolver._calculateBlockRequestsForLight(connectedServerPool, {forkStartingHeight: blockInfo.block.height  });
        this._serverBlockInfo = blockInfo;

        try {

            let n =  blockInfo.block.height + LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS;
            if (n > this.blockchain.blocks.length) throw {message: "blockInfo not enough blocks"};

            for (let i = blockInfo.height - 1; i < n; i++) {

                let answer = connectedServerPool.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", {
                    height: i,
                    onlyHeader: true
                }, i, 6000);

                if ( !answer || !answer.result ) break;


                let blockValidation = this._createServerBlockValidation(i, this._serverBlocks.length-1);

                let block = await this.blockchain.blockCreator.createEmptyBlock(i, blockValidation);
                block.data._onlyHeader = true; //only header
                block.deserializeBlock(answer.block, i, undefined, blockInfo.block.difficultyTargetPrev);


                if (i >= this.poolData.blocksInfo[i].block.height) {
                    if (!BufferExtended.safeCompare(this.poolData.blocksInfo[i - 1].block.hash, block.prevHash)) throw {message: "pool confirmation: prevHash doesn't match"};
                    this._serverBlocks.push(block);
                }
                else if (i === this.poolData.blocksInfo[i].block.height - 1) {
                    if (!BufferExtended.safeCompare(this.poolData.blocksInfo[i].block.hash, block.hash)) throw {message: "pool confirmation: hash doesn't match"};
                }

                let result = await this.blockchain.validateBlockchainBlock( block );
                if ( !result )
                    throw {message: "validation failed"};

            }

            blockInfo.confirmations = n - blockInfo.block.height;

        } catch (exception){
            console.error("Pool Rewards raised an exception: server based validation", exception);
        }

        return found;


    }

    _createServerBlockValidation(height, blockInfoHeight){

        let validationType = {
            "skip-accountant-tree-validation": true,
            "skip-validation-transactions-from-values": true,
        };

        if ( height < this._serverBlocksDifficultyCalculation.difficultyCalculationStarts)
            validationType["skip-difficulty-recalculation"] = true;

        //it's a new light fork && i have less than forkHeight
        if ( blockInfoHeight < consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS )
            validationType["skip-validation-timestamp"] = true;

        validationType["skip-validation-interlinks"] = true;

        return new InterfaceBlockchainBlockValidation(  this._getServerBlock.bind(this), this._getServerDifficultyTarget.bind(this), this._getServerTimeStamp.bind(this), this._getServerPrevHash.bind(this), this._getServerChainHash.bind(this), validationType );

    }

    _getServerBlock(height){

        let forkHeight = height - this._serverBlockInfo.height;

        if ( forkHeight === 0) return this._serverBlockInfo;
        else return this._serverBlocks[forkHeight-1]; // the fork

    }

    _getServerDifficultyTarget(height){

        let forkHeight = height - this._serverBlockInfo.height;

        if ( forkHeight === 0) return this._serverBlockInfo.difficultyTarget;
        else return this._serverBlocks[forkHeight-1].difficultyTarget; // the fork

    }

    _getServerTimeStamp(height){

        let forkHeight = height - this._serverBlockInfo.height;

        if ( forkHeight === 0) return this._serverBlockInfo.timeStamp;
        else return this._serverBlocks[forkHeight-1].timeStamp; // the fork

    }

    _getServerPrevHash(height){

        let forkHeight = height - this._serverBlockInfo.height;

        if ( forkHeight === 0) return this._serverBlockInfo.hash;
        else return this._serverBlocks[forkHeight-1].hash; // the fork

    }

    __getServerChainHash(height){

        let forkHeight = height - this._serverBlockInfo.height;

        if ( forkHeight === 0) return this._serverBlockInfo.hashChain;
        else return this._serverBlocks[forkHeight-1].hashChain; // the fork

    }

    //if wokType === "undefined", workType is both PoW and PoS

    redistributePoolDataBlockInformation(blockInformation, index, workType){

        if (!workType)
            blockInformation.block = undefined; //cancel the block

        //move the blockInformationMinerInstances to the latest non solved blockInformation
        let newBlockInformation = this.poolData.lastBlockInformation;

        if ( !newBlockInformation || newBlockInformation.block || newBlockInformation === blockInformation )
            newBlockInformation = this.poolData.addBlockInformation();

        for (let blockInformationMinersInstance of blockInformation.blockInformationMinersInstances) {

            let nothing = true;

            if ( (!workType || workType === "pow") && blockInformationMinersInstance.minerInstanceTotalDifficultyPOW.isGreaterThan(0)  ) nothing = false;
            if ( (!workType || workType === "pos") && blockInformationMinersInstance.minerInstanceTotalDifficultyPOS.isGreaterThan(0)  ) nothing = false;

            if (nothing) continue;

            let newBlockInformationMinerInstance = newBlockInformation.addBlockInformationMinerInstance( blockInformationMinersInstance.minerInstance );

            blockInformationMinersInstance.cancelReward();

            if (!workType || workType === "pow")
                for (let height in blockInformationMinersInstance._minerInstanceTotalDifficultiesPOW)
                    newBlockInformationMinerInstance.adjustDifficulty( {height: height}, blockInformationMinersInstance._minerInstanceTotalDifficultiesPOW[height], true );

            if (!workType || workType === "pos")
                for (let height in blockInformationMinersInstance._minerInstanceTotalDifficultiesPOS)
                    newBlockInformationMinerInstance.adjustDifficulty( {height: height}, blockInformationMinersInstance._minerInstanceTotalDifficultiesPOS[height], true );

            blockInformationMinersInstance.cancelDifficulties( workType );

            blockInformationMinersInstance.calculateReward(false );

        }

        //clear the blockInformation
        if (!workType)
            this.poolData.deleteBlockInformation(index);

    }


}

export default PoolRewardsManagement;
