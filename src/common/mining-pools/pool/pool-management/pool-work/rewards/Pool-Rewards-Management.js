import StatusEvents from "common/events/Status-Events";
import BufferExtended from 'common/utils/BufferExtended';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import consts from 'consts/const_global'
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

const LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS = 50; //blocks
const VALIDATION_BLOCK_CONFIRMATIONS = 20; //blocks

const MAXIMUM_FAIL_CONFIRMATIONS = 10; //blocks
const CONFIRMATIONS_REQUIRED = 10;

class PoolRewardsManagement{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;
        this.blockchain = blockchain;

        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            await this._blockchainChanged();

        });


        this._serverBlocksDifficultyCalculation = {};
        this._serverBlocks = [];
        this._serverBlockInfo = undefined;
    }

    async _blockchainChanged(){

        if (!this.poolManagement._poolStarted) return;
        if (this.poolData.blocksInfo.length === 0) return;



        let confirmationsPool = 0;
        let confirmationsOthers = 0;
        let confirmationsOthersUnique = 0;
        let found = false;
        let uniques = [];

        let confirmations = {
        };

        let blocksInfoStart = 0;
        for (let i = 0; i< this.poolData.blocksInfo.length; i++)
            if (this.poolData.blocksInfo[i].block !== undefined) {
                blocksInfoStart = this.poolData.blocksInfo[i].block.height;
                break;
            }

        for (let i = this.blockchain.blocks.length-1, n = Math.max( this.blockchain.blocks.blocksStartingPoint, blocksInfoStart ); i>= n; i-- ){

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


        //maybe the last block was not finished
        let start = this.poolData.blocksInfo.length-1;
        if ( this.poolData.blocksInfo[start].block === undefined )
            start --;


        //recalculate the confirmations
        for (let i = start ; i >= 0; i--  ){

            //already confirmed
            if (this.poolData.blocksInfo[i].confirmations > CONFIRMATIONS_REQUIRED) continue;

            //confirm using my own blockchain / light blockchain
            if (this.blockchain.blocks.blocksStartingPoint < this.poolData.blocksInfo[i].block.height){ //i can confirm the block by myself

                if ( BufferExtended.safeCompare( this.poolData.blocksInfo[i].block.hash, this.blockchain.blocks[this.poolData.blocksInfo[i].block.height].hash,  ) ){

                    found = true;

                    let confirmations = confirmations[ this.poolData.blocksInfo[i].block.height ];
                    this.poolData.blocksInfo[i].confirmations = confirmations.confirmationsOthersUnique + confirmations.confirmationsOthers/2 + Math.min(confirmations.confirmationsPool/4, 2);

                } else{
                    
                    if (this.poolData.blocksInfo[i].block.height > this.blockchain.blocks.length - VALIDATION_BLOCK_CONFIRMATIONS)
                        this.poolData.blocksInfo[i].confirmationsFailsTrials++;

                }

            } else { //i can not confirm the block because I am in browser and I need to use the server

                //not enough blocks
                if (this.poolData.blocksInfo[i].block.height < this.blockchain.blocks.length - LIGHT_SERVER_POOL_VALIDATION_BLOCK_CONFIRMATIONS)
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

                //convert reward to confirmedReward
                for (let j=0; j < this.poolData.blocksInfo[i].blockInformationMinersInstances.length; j++) {

                    let reward = this.poolData.blocksInfo[i].blockInformationMinersInstances[j].calculateReward();
                    this.poolData.blocksInfo[i].blockInformationMinersInstances[j].minerInstance.miner.rewardConfirmed += reward;

                }

            }



        }

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
                block.deserializeBlock(answer.block, i, BlockchainMiningReward.getReward(block.height), blockInfo.block.difficultyTarget);


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
            lastBlockInformationMinerInstance.adjustDifficulty(blockInformation.blockInformationMinersInstances[i].minerInstanceTotalDifficulty);


        }

        //clear the blockInformation
        this.poolData.blocksInfo.splice(index, 1);
        
    }


}

export default PoolRewardsManagement;