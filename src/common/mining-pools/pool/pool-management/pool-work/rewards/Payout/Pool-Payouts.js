import Blockchain from "main-blockchain/Blockchain";
import Log from 'common/utils/logging/Log';

const BigNumber = require ('bignumber.js');

import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

const PAYOUT_INTERVAL = consts.DEBUG ? 5 : 40 + Math.floor( Math.random()*10 ); //in blocks;
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

        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------PAYOUT------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);

        let blocksConfirmed = [];
        for (let i=0; i<this.poolData.blocksInfo.length-1; i++)
            if (this.poolData.blocksInfo[i].confirmed && !this.poolData.blocksInfo[i].payout)
                blocksConfirmed.push(this.poolData.blocksInfo[i]);

        console.info("Payout: Blocks confirmed: ", blocksConfirmed.length);


        if (blocksConfirmed.length === 0){
            console.warn("Payout: No payouts, because no blocks were confirmed");
            return false;
        }

        try{

            this.poolData.miners.forEach((miner)=>{

                miner.__tempRewardConfirmedOther = 0;

            });

            this._toAddresses = [];

            Log.info("Payout: Initialized ", Log.LOG_TYPE.POOLS);

            let totalSumReward = 0;
            for (let i=0; i<blocksConfirmed.length; i++)
                totalSumReward += BlockchainMiningReward.getReward ( blocksConfirmed[i].block.height ) * (1 - this.poolManagement.poolSettings.poolFee);

            let poolFork = totalSumReward - Blockchain.blockchain.accountantTree.getBalance( this.blockchain.mining.minerAddress );

            let poolForkDifferencePerBlock = 0;

            if (poolFork > 0)
                poolForkDifferencePerBlock = Math.ceil( poolFork / blocksConfirmed );


            for (let i=0; i<blocksConfirmed.length; i++) {

                let totalDifficulty = new BigNumber(0);

                blocksConfirmed[i].blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{
                    totalDifficulty = totalDifficulty.plus(blockInformationMinerInstance.minerInstanceTotalDifficulty);
                });

                if (!totalDifficulty.isEqualTo(blocksConfirmed[i].totalDifficulty))
                    throw {message: "Total Difficulty doesn't match", totalDifficulty: totalDifficulty,  blockConfirmedDifficulty: blocksConfirmed[i].totalDifficulty};

                let maxSumReward = BlockchainMiningReward.getReward( blocksConfirmed[i].block.height ) * (1 - this.poolManagement.poolSettings.poolFee);

                let sumReward = 0;
                for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++) {
                    blocksConfirmed[i].blockInformationMinersInstances[j].calculateReward(false);
                    sumReward += blocksConfirmed[i].blockInformationMinersInstances[j].reward;
                    sumReward += blocksConfirmed[i].blockInformationMinersInstances[j].rewardForReferral;
                }

                let difference = (sumReward - maxSumReward) + poolForkDifferencePerBlock;

                //reducing the price
                if ( Math.abs( difference ) > 1 ) {

                    difference = Math.ceil( difference  / blocksConfirmed[i].blockInformationMinersInstances.length );

                    blocksConfirmed[i].blockInformationMinersInstances.forEach( (blockInformationMinerInstance)=>{

                        if (blockInformationMinerInstance.reward - difference > 0) {
                            blockInformationMinerInstance.miner.rewardConfirmed -= difference;
                            blockInformationMinerInstance.reward -= difference;
                        }


                    })

                }


                blocksConfirmed[i].blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{

                    blockInformationMinerInstance.miner.__tempRewardConfirmedOther += blockInformationMinerInstance.reward;

                    if (blockInformationMinerInstance.miner.referrals.referralLinkMiner !== undefined)
                        blockInformationMinerInstance.miner.referrals.referralLinkMiner.miner.__tempRewardConfirmedOther += blockInformationMinerInstance.rewardForReferral;

                });

            }

            Log.info("Payout: Blocks Confirmed Processed", Log.LOG_TYPE.POOLS);

            //add rewardConfirmedOther
            this.poolData.miners.forEach((miner)=>{

                if ( (miner.__tempRewardConfirmedOther + miner.rewardConfirmedOther) >= consts.MINING_POOL.MINING.MINING_POOL_MINIMUM_PAYOUT )
                    this._addAddressTo(miner.address).amount += miner.__tempRewardConfirmedOther + miner.rewardConfirmedOther ;

            });

            Log.info("Payout: Adding rewardConfirmedOther", Log.LOG_TYPE.POOLS);

            //verify to send to other

            if (this._toAddresses.length === 0) throw {message: "No Addresses to send money"};

            //let's floor the data
            for (let i=0; i < this._toAddresses.length; i++)
                this._toAddresses[i].amount = Math.floor( this._toAddresses[i].amount );

            Log.info("Number of original recipients: " + this._toAddresses.length, Log.LOG_TYPE.POOLS);

            this._removeAddressTo(this.blockchain.mining.unencodedMinerAddress);

            Log.info("Number of initial recipients: " + this._toAddresses.length, Log.LOG_TYPE.POOLS);

            for (let i=this._toAddresses.length-1; i >= 0; i--){
                if (this._toAddresses[i].amount < consts.MINING_POOL.MINING.MINING_POOL_MINIMUM_PAYOUT)
                    this._removeAddressTo(this._toAddresses[i].address);
            }

            let totalToPay = 0;
            for (let i=0; i< this._toAddresses.length; i++ )
                totalToPay += this._toAddresses[i].amount;

            Log.info("Number of recipients: " + this._toAddresses.length, Log.LOG_TYPE.POOLS);
            Log.info("Payout Total To Pay: " + (totalToPay / WebDollarCoins.WEBD), Log.LOG_TYPE.POOLS);

            let index = 0;
            while (index * 255 < this._toAddresses.length) {

                let toAddresses = this._toAddresses.slice(index*255, (index+1)*255);

                try {
                    let transaction = await Blockchain.Transactions.wizard.createTransactionSimple( this.blockchain.mining.minerAddress, toAddresses, undefined, PAYOUT_FEE, );
                    if (!transaction.result) throw {message: "Transaction was not made"};
                } catch (exception){
                    Log.error("Payout: ERROR CREATING TRANSACTION", Log.LOG_TYPE.POOLS);
                    throw exception;
                }

                index++;
            }

            Log.info("Payout: Transaction Created", Log.LOG_TYPE.POOLS);

            for (let i=0; i<blocksConfirmed.length; i++) {

                blocksConfirmed[i].blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{

                    let miner = blockInformationMinerInstance.miner;
                    let paid = this._findAddressTo(miner.address);

                    try{

                        //not paid
                        //move funds to confirmedOther
                        if (paid === null)
                            miner.rewardConfirmedOther += miner.__tempRewardConfirmedOther;

                        miner.__tempRewardConfirmedOther = 0;

                        blockInformationMinerInstance.minerInstanceTotalDifficulty = new BigNumber(0);
                        blockInformationMinerInstance.reward = 0; //i already paid


                        if ( miner.referrals.referralLinkMiner !== undefined ) {

                            miner.referrals.referralLinkMiner.rewardReferralSent += blockInformationMinerInstance.rewardForReferral;
                            miner.referrals.referralLinkMiner.rewardReferralConfirmed -= blockInformationMinerInstance.rewardForReferral;

                            blockInformationMinerInstance.rewardForReferral = 0;
                        }

                    } catch (exception){

                    }

                });

                blocksConfirmed[i].payout = true;
            }


            let total = 0;
            for (let i=0; i<this._toAddresses.length; i++){

                let miner = this.poolData.findMiner( this._toAddresses[i].address );
                if (miner === null) Log.error("ERROR! Miner was not found at the payout", Log.LOG_TYPE.POOLS);

                miner.rewardSent += this._toAddresses[i].amount; //i paid totally
                miner.rewardConfirmed = 0; //paid this
                miner.rewardConfirmedOther = 0; //paid this

                miner.__tempRewardConfirmedOther = 0; //paid this

                total += this._toAddresses[i].amount;

            }

            Log.info("Payout Total Paid "+ (total / WebDollarCoins.WEBD), Log.LOG_TYPE.POOLS)


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

        if (found !== null)
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
