import StatusEvents from "common/events/Status-Events";
import BufferExtended from 'common/utils/BufferExtended';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import consts from 'consts/const_global'
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"
import PoolPayouts from "./Pool-Payouts"

const LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS = 50; //blocks
const VALIDATION_BLOCK_CONFIRMATIONS = 20; //blocks

const MAXIMUM_FAIL_CONFIRMATIONS = 10; //blocks

const CONFIRMATIONS_REQUIRED = consts.DEBUG ? 1 : 10;

const REQUIRE_OTHER_CONFIRMATIONS = consts.DEBUG ? false : true;

class PoolRewardsManagement{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;
        this.blockchain = blockchain;

        this.poolPayouts = new PoolPayouts(poolManagement, poolData, blockchain);

        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            if (!this.poolManagement._poolStarted) return;

            await this._blockchainChanged();

        });


        this._serverBlocksDifficultyCalculation = {};
        this._serverBlocks = [];
        this._serverBlockInfo = undefined;
    }

    async _blockchainChanged(){


        if (this.poolData.blocksInfo.length === 0) return;

        let poolBlocksConfirmed = 0;
        let poolBlocksUnconfirmed = 0;

        let confirmationsPool = 0;
        let confirmationsOthers = 0;
        let confirmationsOthersUnique = 0;
        let found = false;
        let uniques = [];

        let confirmations = {
        };

        let firstBlock;
        for (let i=0; i < this.poolData.blocksInfo.length; i++)
            if ( this.poolData.blocksInfo[ i ].block !== undefined )
                if ( firstBlock === undefined || this.poolData.blocksInfo[i].block.height < firstBlock) firstBlock = this.poolData.blocksInfo[ i ].block.height;

        for (let i = this.blockchain.blocks.length-1, n = Math.max( this.blockchain.blocks.blocksStartingPoint, firstBlock ); i>= n; i-- ) {

            if ( this.blockchain.mining.unencodedMinerAddress.equals( this.blockchain.blocks[i].data.minerAddress ))
                confirmationsPool++;
            else {
                if (uniques[this.blockchain.blocks[i].data.minerAddress.toString("hex")] === undefined){
                    uniques[this.blockchain.blocks[i].data.minerAddress.toString("hex")] = true;
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

        //recalculate the confirmations
        for (let i = this.poolData.blocksInfo.length-1; i >= 0; i--  ){

            //already confirmed
            if ( this.poolData.blocksInfo[i].payout){

                //let's delete old payouts
                if ( this.blockchain.blocks.length - this.poolData.blocksInfo[i].block.height > 40) {
                    this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid++;
                    this.poolData.deleteBlockInformation(i);
                }

                poolBlocksConfirmed++;
                continue;

            }

            //already confirmed
            if (this.poolData.blocksInfo[i].confirmed){
                poolBlocksConfirmed++;
                continue;
            }

            let blockInfo = this.poolData.blocksInfo[i].block;

            if (blockInfo === undefined){

                if (i === this.poolData.blocksInfo.length-1 ) continue;
                else { //for some reasons, maybe save/load
                    this.redistributePoolDataBlockInformation(this.poolData.blocksInfo[i], i );
                    continue;
                }

            }


            //not ready at the moment
            if (blockInfo.height > this.blockchain.blocks.length)
                continue;

            //confirm using my own blockchain / light blockchain
            if (this.blockchain.blocks.blocksStartingPoint < blockInfo.height){ //i can confirm the block by myself

                if (this.blockchain.blocks[blockInfo.height] === undefined) continue;

                if ( BufferExtended.safeCompare( blockInfo.hash, this.blockchain.blocks[blockInfo.height].hash,  ) ){

                    found = true;

                    let confirmation = confirmations[ blockInfo.height ];
                    this.poolData.blocksInfo[i].confirmations = confirmation.confirmationsOthersUnique + confirmation.confirmationsOthers/2 + Math.min(confirmation.confirmationsPool/4, REQUIRE_OTHER_CONFIRMATIONS ? 2 : 10000);

                } else{
                    
                    if (blockInfo.height > this.blockchain.blocks.length - VALIDATION_BLOCK_CONFIRMATIONS)
                        this.poolData.blocksInfo[i].confirmationsFailsTrials++;

                }

            } else { //i can not confirm the block because I am in browser and I need to use the server

                //not enough blocks
                if (blockInfo.height < this.blockchain.blocks.length - LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS)
                    continue;

                found = await this._confirmUsingPoolServer(this.poolData.blocksInfo[i]);
                
                if (!found)
                    this.poolData.blocksInfo[i].confirmationsFailsTrials++;

            }
            
            if (!found)
                this.poolData.blocksInfo[i].confirmations = 0;
            
            //to mail fail trials
            if (this.poolData.blocksInfo[i].confirmationsFailsTrials > MAXIMUM_FAIL_CONFIRMATIONS){

                this.redistributePoolDataBlockInformation(this.poolData.blocksInfo[i], i );
                continue;

            }

            if (found && this.poolData.blocksInfo[i].confirmations > CONFIRMATIONS_REQUIRED){

                this.poolData.blocksInfo[i].confirmed = true;

                //convert reward to confirmedReward
                this.poolData.blocksInfo[i].blockInformationMinersInstances.forEach((minerInstance)=>{

                    let reward = minerInstance.calculateReward(false);

                    minerInstance.miner.rewardConfirmed += reward;
                    minerInstance.miner.rewardTotal -= reward;


                    if ( minerInstance.miner.referrals.referralLinkMiner !== undefined && this.poolManagement.poolSettings.poolReferralFee > 0) {
                        minerInstance.miner.referrals.referralLinkMiner.rewardReferralConfirmed += minerInstance.rewardForReferral;
                        minerInstance.miner.referrals.referralLinkMiner.rewardReferralTotal -= minerInstance.rewardForReferral;
                    }

                });

                poolBlocksConfirmed++;

            } else {
                poolBlocksUnconfirmed++;
            }

        }

        this.poolManagement.poolStatistics.addBlocksStatistics(poolBlocksConfirmed, poolBlocksUnconfirmed );

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

                if (answer === null || answer.result !== true) break;


                let blockValidation = this._createServerBlockValidation(i, this._serverBlocks.length-1);

                let block = this.blockchain.blockCreator.createEmptyBlock(i, blockValidation);
                block.data._onlyHeader = true; //only header
                block.deserializeBlock(answer.block, i, undefined, blockInfo.block.difficultyTarget);


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

        if ( height === this.blockchain.blocks.length-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        //it's a new light fork && i have less than forkHeight
        if ( blockInfoHeight < consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS )
            validationType["skip-validation-timestamp"] = true;

        validationType["skip-validation-interlinks"] = true;

        return new InterfaceBlockchainBlockValidation(  this._getServerBlock.bind(this), this._getServerDifficultyTarget.bind(this), this._getServerTimeStamp.bind(this), this._getServerPrevHash.bind(this), validationType );
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
    
    redistributePoolDataBlockInformation(blockInformation, index){

        blockInformation.block = undefined; //cancel the block
        
        //move the blockInformationMinerInstances to the latest non solved blockInformation
        let lastBlockInformation = this.poolData.lastBlockInformation;

        if (lastBlockInformation.block !== undefined)
            lastBlockInformation = this.poolData.addBlockInformation();

        for (let i=0; i<blockInformation.blockInformationMinersInstances.length; i++) {

            let lastBlockInformationMinerInstance = lastBlockInformation._addBlockInformationMinerInstance( blockInformation.blockInformationMinersInstances[i].minerInstance );

            blockInformation.blockInformationMinersInstances[i].cancelReward();
            lastBlockInformationMinerInstance.adjustDifficulty(blockInformation.blockInformationMinersInstances[i].minerInstanceTotalDifficulty, true);
        }

        //clear the blockInformation
        this.poolData.deleteBlockInformation(index);
        
    }


}

export default PoolRewardsManagement;