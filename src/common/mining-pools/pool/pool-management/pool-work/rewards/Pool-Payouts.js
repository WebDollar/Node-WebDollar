import Blockchain from "main-blockchain/Blockchain";

const BigNumber = require ('bignumber.js');

import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

const PAYOUT_INTERVAL = consts.DEBUG ? 5 : 30 + Math.floor( Math.random()*10 ); //in blocks;
const PAYOUT_MINIMUM  = consts.MINING_POOL.MINING.FEE_THRESHOLD;

class PoolPayouts{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;

        this.blockchain = blockchain;

        this._payoutInProgress = false;

        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            if (!this.poolManagement._poolStarted) return;


            if (this.blockchain.blocks.length % PAYOUT_INTERVAL === 0) {
                await this.doPayout();
            }


        });

        this._toAddresses = [];

    }

    async doPayout(){

        if (this._payoutInProgress) return;

        this._payoutInProgress = true;
        await this._doPayout();
        this._payoutInProgress = false;
    }

    async _doPayout(){

        if (!Blockchain.synchronized) return;

        let blocksConfirmed = [];
        for (let i=0; i<this.poolData.blocksInfo.length; i++)
            if (this.poolData.blocksInfo[i].confirmed && !this.poolData.blocksInfo[i].payout)
                blocksConfirmed.push(this.poolData.blocksInfo[i]);


        if (blocksConfirmed.length === 0){
            console.warn("No payouts, because no blocks were confirmed");
            return false;
        }

        try{

            console.info("--------------------------------------------------");
            console.info("--------------------------------------------------");
            console.info("--------------------PAYOUT------------------------");
            console.info("--------------------------------------------------");
            console.info("--------------------------------------------------");

            this.poolData.miners.forEach((miner)=>{

                miner.__tempRewardConfirmedOther = 0;
                miner.referrals.__tempRewardReferralsConfirmedToBeSent = 0;

            });

            this._toAddresses = [];

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

                let difference = sumReward - maxSumReward ;

                if ( Math.abs( difference ) > 1 ) {

                    difference = Math.floor( difference  / blocksConfirmed[i].blockInformationMinersInstances.length );

                    blocksConfirmed[i].blockInformationMinersInstances.forEach( (blockInformationMinerInstance)=>{

                        if (blockInformationMinerInstance.reward - difference > 0) {
                            blockInformationMinerInstance.miner.rewardConfirmed -= difference;
                            blockInformationMinerInstance.reward -= difference;
                        }


                    })

                }


                blocksConfirmed[i].blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{

                    blockInformationMinerInstance.miner.__tempRewardConfirmedOther += blockInformationMinerInstance.reward;

                });

            }

            //add rewardConfirmedOther
            this.poolData.miners.forEach((miner)=>{

                miner.__tempRewardConfirmedOther += miner.referrals.rewardReferralsConfirmed;

            });

            //add rewardConfirmedOther
            this.poolData.miners.forEach((miner)=>{

                if (miner.__tempRewardConfirmedOther >= PAYOUT_MINIMUM)
                    this._addAddressTo(miner.address).amount += miner.__tempRewardConfirmedOther ;

            });

            //verify to send to other

            if (this._toAddresses.length === 0) throw {message: "No Addresses to send money"};

            //let's floor the data
            for (let i=0; i < this._toAddresses.length; i++)
                this._toAddresses[i].amount = Math.floor( this._toAddresses[i].amount );

            let index = 0;
            while (index * 256 < this._toAddresses.length) {

                let toAddresses = this._toAddresses.slice(index*255, (index+1)*255);

                let transaction = await Blockchain.Transactions.wizard.createTransactionSimple(this.blockchain.mining.minerAddress, toAddresses, undefined, consts.MINING_POOL.MINING.FEE_THRESHOLD,);
                if (!transaction.result) throw {message: "Transaction was not made"};

                index++;
            }


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
                            miner.referrals.referralLinkMiner.rewardReferralSent += miner.referrals.referralLinkMiner.rewardReferralConfirmed;
                            miner.referrals.referralLinkMiner._rewardReferralConfirmed = 0;
                        }

                    } catch (exception){

                    }

                });

                blocksConfirmed[i].payout = true;
            }


            for (let i=0; i<this._toAddresses.length; i++){

                let miner = this.poolData.findMiner( this._toAddresses[i].address );
                if (miner === null) console.error("ERROR! Miner was not found at the payout");

                miner.rewardSent += this._toAddresses[i].amount; //i paid totally
                miner.rewardConfirmed = 0; //paid this
                miner.rewardConfirmedOther = 0; //paid this

                miner.__tempRewardConfirmedOther = 0; //paid this

                miner.referrals.rewardReferralsConfirmed = 0;


            }


        } catch (exception){

            console.error("Pool Payouts raised an error", exception);
            return false;

        }

        return true;

    }

    _findAddressTo(address){

        for (let q=0; q<this._toAddresses.length; q++)
            if (this._toAddresses[q].address.equals( address ))
                return this._toAddresses[q];

        return null;

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

}

export default PoolPayouts