import Blockchain from "main-blockchain/Blockchain";

const BigNumber = require ('bignumber.js');

import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

const PAYOUT_INTERVAL = consts.DEBUG ? 5 : 180 + Math.floor( Math.random()*10 ); //in blocks;
const PAYOUT_MINIMUM  = consts.MINING_POOL.MINING.FEE_THRESHOLD;

class PoolPayouts{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;

        this.blockchain = blockchain;


        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            if (!this.poolManagement._poolStarted) return;

            if (this.blockchain.blocks.length % PAYOUT_INTERVAL === 0)
                await this.doPayout();


        });

        this._toAddresses = [];

    }

    async doPayout(){

        try{

            let blocksConfirmed = [];
            for (let i=0; i<this.poolData.blocksInfo.length; i++)
                if (this.poolData.blocksInfo[i].confirmed && !this.poolData.blocksInfo[i].payout)
                    blocksConfirmed.push(this.poolData.blocksInfo[i]);


            if (blocksConfirmed.length === 0){
                console.warn("No payouts, because no blocks were confirmed");
                return false;
            }


            let toAddresses = [];

            for (let i=0; i<blocksConfirmed.length; i++) {

                let totalDifficulty = new BigNumber(0);

                blocksConfirmed[i].blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{
                    totalDifficulty = totalDifficulty.plus(blockInformationMinerInstance.minerInstanceTotalDifficulty);
                });

                if (!totalDifficulty.isEqualTo(blocksConfirmed[i].totalDifficulty))
                    throw {message: "Total Difficulty doesn't match"};

                let maxSumReward = BlockchainMiningReward.getReward( blocksConfirmed[i].block.height ) * (1 - this.poolManagement.poolSettings.poolFee);

                let sumReward = 0;
                for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++)
                    sumReward += blocksConfirmed[i].blockInformationMinersInstances[j].calculateReward();

                let difference = maxSumReward - sumReward;

                if (difference !== 0) {

                    difference /= blocksConfirmed[i].blockInformationMinersInstances.length;


                    blocksConfirmed[i].blockInformationMinersInstances.forEach( (blockInformationMinerInstance)=>{

                        let newReward = Math.floor(blockInformationMinerInstance.reward - difference);

                        if (newReward > 0)
                            blockInformationMinerInstance.reward = newReward;

                    })

                }


                blocksConfirmed[i].blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{

                    if (blockInformationMinerInstance.reward === 0) return;

                    if (blockInformationMinerInstance.reward <= PAYOUT_MINIMUM ){
                        blockInformationMinerInstance.miner.rewardConfirmedOther += blockInformationMinerInstance.reward;
                        blockInformationMinerInstance.reward = 0;
                        return;
                    }

                    this._addAddressTo(blockInformationMinerInstance.address).amount += blockInformationMinerInstance.reward;

                });

            }

            this.poolData.miners.forEach((miner)=>{

                let addressTo = this._findAddressTo(miner.address);

                addressTo.

            });

            //verify to send to other

            if (toAddresses.length === 0) throw {message: "No Addresses to send money"};

            let transaction = await Blockchain.Transactions.wizard.createTransactionSimple( this.blockchain.mining.minerAddress, toAddresses, undefined, consts.MINING_POOL.MINING.FEE_THRESHOLD, );

            if (!transaction.result) throw {message: "Transaction was not made"};


            for (let i=0; i<blocksConfirmed.length; i++) {

                blocksConfirmed.blockInformationMinersInstances.forEach((blockInformationMinerInstance)=>{

                    blockInformationMinerInstance.miner.rewardSent += blockInformationMinerInstance.reward;
                    blockInformationMinerInstance.miner.rewardTotal -= blockInformationMinerInstance.reward;
                    blockInformationMinerInstance.reward = 0;

                });

                blocksConfirmed[i].payout = true;

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

        return {
            address: address,
            amount: 0,
        }

    }

}

export default PoolPayouts