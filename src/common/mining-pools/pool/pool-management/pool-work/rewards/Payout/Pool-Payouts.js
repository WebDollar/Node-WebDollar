import Log from 'common/utils/logging/Log';

const BigNumber = require ('bignumber.js');

import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import Blockchain from "main-blockchain/Blockchain";

const PAYOUT_INTERVAL = consts.DEBUG ? 6 : 30; //in blocks;
const PAYOUT_FEE = WebDollarCoins.WEBD * 0;


class PoolPayouts{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;

        this.blockchain = blockchain;
        this._payoutInProgress = false;

        StatusEvents.on("blockchain/block-inserted", async (data)=>{

            if (!this.poolManagement._poolStarted) return;
            if (!Blockchain.loaded) return;

            Log.info("Next Payout in " + ( PAYOUT_INTERVAL - (this.blockchain.blocks.length % PAYOUT_INTERVAL))+"  blocks", Log.LOG_TYPE.POOLS );

            let blocksConfirmed = this.poolData.confirmedBlockInformations;

            Log.info("Next Payout - Blocks confirmed: " + blocksConfirmed.length, Log.LOG_TYPE.POOLS );

            if (this.blockchain.blocks.length % PAYOUT_INTERVAL === 0)
                await this.doPayout();


        });

        this._toAddresses = [];

    }

    async doPayout(){

        if (this._payoutInProgress) return;

        this._payoutInProgress = true;

        try {
            await this._doPayout();
        } catch (exception){
            console.error("doPayout raised an error", exception)
        }

        this._payoutInProgress = false;

    }

    async _doPayout(){

        if (!Blockchain.synchronized) return;

        let paymentType = "pos";
        if ( this.blockchain.blocks.length % (2*PAYOUT_INTERVAL) === 0) paymentType = "pow";

        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------PAYOUT------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);

        //last block should not be processed at the moment to avoid problems with redistribution

        let blocksConfirmed = [];

        for (let blockInfo of this.poolData.blocksInfo)
            if ( blockInfo.block && blockInfo.confirmed && !blockInfo.payout &&  !blockInfo.payoutTransaction )
                if ( (BlockchainGenesis.isPoSActivated( blockInfo.block.height ) && paymentType === "pos") ||  ( !BlockchainGenesis.isPoSActivated( blockInfo.block.height ) && paymentType === "pow" ) )
                    blocksConfirmed.push(blockInfo);

        console.info("Payout: Blocks confirmed: ", blocksConfirmed.length);


        if (blocksConfirmed.length === 0){
            console.warn("Payout: No payouts, because no blocks were confirmed");
            return false;
        }

        try{

            for (let miner of this.poolData.miners)
                miner.__tempRewardConfirmedOther = 0;

            this._toAddresses = [];

            Log.info("Payout: Initialized ", Log.LOG_TYPE.POOLS);

            let totalSumReward = 0;

            for (let blockConfirmed of blocksConfirmed)
                totalSumReward += BlockchainMiningReward.getReward( blockConfirmed.block.height) * (1 - this.poolManagement.poolSettings.poolFee );

            let poolFork = totalSumReward - Blockchain.blockchain.accountantTree.getBalance( this.blockchain.mining.minerAddress );

            let poolForkDifferencePerBlock = 0;

            if (poolFork > 0)
                poolForkDifferencePerBlock = Math.ceil( poolFork / blocksConfirmed.length );


            for (let blockConfirmed of blocksConfirmed){

                let totalDifficultyPOW = new BigNumber(0), totalDifficultyPOS = new BigNumber(0);

                this.poolManagement.poolRewardsManagement.redistributePoolDataBlockInformation( blockConfirmed, blockConfirmed, (paymentType === "pow") ? "pos" : "pow");

                for (let blockInformationMinerInstance of blockConfirmed.blockInformationMinersInstances){
                    totalDifficultyPOW = totalDifficultyPOW.plus(blockInformationMinerInstance.minerInstanceTotalDifficultyPOW);
                    totalDifficultyPOS = totalDifficultyPOS.plus(blockInformationMinerInstance.minerInstanceTotalDifficultyPOS);
                };

                if ( !totalDifficultyPOW.isEqualTo(blockConfirmed.totalDifficultyPOW)  )
                    console.error( "Total POW Difficulty doesn't match", {totalDifficultyPOW: totalDifficultyPOW,  blockConfirmedDifficulty: blockConfirmed.totalDifficultyPOW });

                if ( !totalDifficultyPOS.isEqualTo(blockConfirmed.totalDifficultyPOS) )
                    console.error(  "Total POS Difficulty doesn't match", { totalDifficultyPOS: totalDifficultyPOS, blockConfirmedDifficulty: blockConfirmed.totalDifficultyPOS });

                if ( totalDifficultyPOS.isLessThanOrEqualTo(0) && totalDifficultyPOW.isLessThanOrEqualTo(0  ) ) {

                    if ( consts.MINING_POOL.SKIP_POS_REWARDS || consts.MINING_POOL.SKIP_POW_REWARDS)
                        continue;

                    console.info("--------------------------");
                    console.info("TOTAL POS AND POW ARE BOTH ZERO", {totalDifficultyPOS: totalDifficultyPOS,  totalDifficultyPOW: totalDifficultyPOW});
                    console.info("--------------------------");

                    blockConfirmed.payout = true;
                    continue;

                }

                let maxSumReward = BlockchainMiningReward.getReward( blockConfirmed.block.height ) * (1 - this.poolManagement.poolSettings.poolFee);

                let sumReward = 0;

                for (let blockInformationMinerInstance of blockConfirmed.blockInformationMinersInstances){
                    blockInformationMinerInstance.calculateReward(false);
                    sumReward += blockInformationMinerInstance.reward;
                    sumReward += blockInformationMinerInstance.rewardForReferral;
                };

                let difference = (sumReward - maxSumReward) + poolForkDifferencePerBlock;

                //reducing the price
                if ( Math.abs( difference ) > 1 ) {

                    difference = Math.ceil( difference  / blockConfirmed.blockInformationMinersInstances.length );

                    for (let blockInformationMinerInstance of blockConfirmed.blockInformationMinersInstances){

                        if (blockInformationMinerInstance.reward - difference > 0) {
                            blockInformationMinerInstance.miner.rewardConfirmed -= difference;
                            blockInformationMinerInstance.reward -= difference;
                        }


                    }

                }


                for (let blockInformationMinerInstance of blockConfirmed.blockInformationMinersInstances){

                    blockInformationMinerInstance.miner.__tempRewardConfirmedOther += blockInformationMinerInstance.reward;

                    if ( blockInformationMinerInstance.miner.referrals.referralLinkMiner )
                        blockInformationMinerInstance.miner.referrals.referralLinkMiner.miner.__tempRewardConfirmedOther += blockInformationMinerInstance.rewardForReferral;

                };

                await this.blockchain.sleep(500);

            }

            Log.info("Payout: Blocks Confirmed Processed", Log.LOG_TYPE.POOLS);

            //add rewardConfirmedOther
            for (let miner of this.poolData.miners){

                if ( (miner.rewardConfirmedOther + miner.__tempRewardConfirmedOther ) >= consts.MINING_POOL.MINING.MINING_POOL_MINIMUM_PAYOUT ) {

                    this._addAddressTo(miner.address).amount += miner.rewardConfirmedOther + miner.__tempRewardConfirmedOther;

                    miner.__tempRewardConfirmedOther = 0;
                    miner.rewardConfirmedOther = 0;

                }

            }

            await this.blockchain.sleep(500);

            Log.info("Payout: Adding rewardConfirmedOther", Log.LOG_TYPE.POOLS);

            //verify to send to other

            if (this._toAddresses.length === 0) throw {message: "No Addresses to send money"};

            //let's floor the data
            for (let toAddress of this._toAddresses)
                toAddress.amount = Math.floor( toAddress.amount );

            Log.info("Number of original recipients: " + this._toAddresses.length, Log.LOG_TYPE.POOLS);

            this._removeAddressTo(this.blockchain.mining.unencodedMinerAddress);

            Log.info("Number of initial recipients: " + this._toAddresses.length, Log.LOG_TYPE.POOLS);

            for (let i=this._toAddresses.length-1; i >= 0; i--){
                if (this._toAddresses[i].amount < consts.MINING_POOL.MINING.MINING_POOL_MINIMUM_PAYOUT)
                    this._removeAddressTo(this._toAddresses[i].address);
            }

            let totalToPay = 0;

            for (let toAddress of this._toAddresses)
                totalToPay += toAddress.amount;

            Log.info("Number of recipients: " + this._toAddresses.length, Log.LOG_TYPE.POOLS);
            Log.info("Payout Total To Pay: " + (totalToPay / WebDollarCoins.WEBD), Log.LOG_TYPE.POOLS);

            let index = 0;
            let transactions = [];

            while (index * 255 < this._toAddresses.length) {

                let toAddresses = this._toAddresses.slice(index*255, (index+1)*255);

                try {

                    let transaction = await Blockchain.Transactions.wizard.createTransactionSimple( this.blockchain.mining.minerAddress, toAddresses, undefined, PAYOUT_FEE, );
                    if (!transaction.result) throw {message: "Transaction was not made"};

                    transactions.push(transaction);
                } catch (exception){
                    Log.error("Payout: ERROR CREATING TRANSACTION", Log.LOG_TYPE.POOLS);
                    throw exception;
                }

                index++;
            }

            Log.info("Payout: Transaction Created", Log.LOG_TYPE.POOLS);

            for (let blockConfirmed of blocksConfirmed ){

                for (let blockInformationMinerInstance of blockConfirmed.blockInformationMinersInstances){

                    let miner = blockInformationMinerInstance.miner;
                    let paid = this._findAddressTo(miner.address);

                    try{

                        //not paid
                        //move funds to confirmedOther
                        if ( !paid )
                            miner.rewardConfirmedOther += miner.__tempRewardConfirmedOther;

                        miner.__tempRewardConfirmedOther = 0;

                        blockInformationMinerInstance.reset();

                        blockInformationMinerInstance.reward = 0; //i already paid

                        if ( miner.referrals.referralLinkMiner  ) {

                            miner.referrals.referralLinkMiner.rewardReferralSent += blockInformationMinerInstance.rewardForReferral;
                            miner.referrals.referralLinkMiner.rewardReferralConfirmed -= blockInformationMinerInstance.rewardForReferral;

                            blockInformationMinerInstance.rewardForReferral = 0;
                        }

                    } catch (exception){

                    }

                };

                blockConfirmed.payoutTransaction = true;

                await this.blockchain.sleep(500);
            }


            let total = 0, i=0;

            for (let toAddress of this._toAddresses){

                let miner = this.poolData.findMiner( toAddress.address );

                if ( !miner ) {
                    Log.error("ERROR! Miner was not found at the payout", Log.LOG_TYPE.POOLS);
                    continue;
                }


                miner.rewardSent += toAddress.amount; //i paid totally
                miner.rewardConfirmed = 0; //paid this
                miner.rewardConfirmedOther = 0; //paid this

                miner.__tempRewardConfirmedOther = 0; //paid this

                total += toAddress.amount;

                if (i % 100 === 0)
                    await this.blockchain.sleep(200);

                i++;
            }

            Log.info("Payout Total Paid "+ (total / WebDollarCoins.WEBD), Log.LOG_TYPE.POOLS);

            if (transactions.length > 0)
                for (let blockConfirmed of blocksConfirmed)
                    blockConfirmed.payoutTx = transactions[0].txId;


        } catch (exception){

            Log.error("----------------------------------------", Log.LOG_TYPE.POOLS);
            Log.error("Pool Payouts raised an error", Log.LOG_TYPE.POOLS, exception);
            Log.error("----------------------------------------", Log.LOG_TYPE.POOLS);

            return false;

        }

        return true;

    }

    _findAddressTo(address, returnPos = false){

        for (let q=0; q<this._toAddresses.length; q++)
            if (this._toAddresses[q].address.equals( address ))
                return returnPos ? q : this._toAddresses[q];

        return returnPos ? -1 : null;

    }

    _addAddressTo(address){

        let found = this._findAddressTo(address);

        if (found )
            return found;

        let object = {
            address: address,
            amount: 0,
        };

        this._toAddresses.push(object);

        return object;

    }

    _removeAddressTo(address){

        let index = this._findAddressTo(address, true);
        if (index !== -1)
            this._toAddresses.splice(index, 1);

    }

}

export default PoolPayouts
