import Blockchain from "main-blockchain/Blockchain";

const BigNumber = require ('bignumber.js');

import StatusEvents from "common/events/Status-Events";
import consts from 'consts/const_global'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

const DO_PAYOUT = consts.DEBUG ? 10 : 180 + Math.floor( Math.random()*10 ); //in blocks;

class PoolPayouts{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;

        this.blockchain = blockchain;


        StatusEvents.on("blockchain/blocks-count-changed",async (data)=>{

            if (!this.poolManagement._poolStarted) return;

            if (this.blockchain.blocks.length % DO_PAYOUT === 0)
                await this.doPayout();


        });

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

                for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++)
                    totalDifficulty = totalDifficulty.plus(blocksConfirmed[i].blockInformationMinersInstances[j].minerInstanceTotalDifficulty);

                if (!totalDifficulty.isEqualTo(blocksConfirmed[i].totalDifficulty))
                    throw {message: "Total Difficulty doesn't match"};

                let maxSumReward = BlockchainMiningReward.getReward(height) * (1 - this.poolManagement.poolSettings.poolFee);

                let sumReward = 0;
                for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++)
                    sumReward = blocksConfirmed[i].blockInformationMinersInstances[j].calculateReward();

                let difference = maxSumReward - sumReward;

                if (difference !== 0) {

                    difference /= blocksConfirmed[i].blockInformationMinersInstances.length;

                    for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++) {

                        let newReward = Math.floor(blocksConfirmed[i].blockInformationMinersInstances[j].reward * difference);

                        if (newReward > 0)
                            blocksConfirmed[i].blockInformationMinersInstances[j].reward = newReward;

                    }
                }


                for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++) {

                    let found = false;

                    for (let q=0; q<toAddresses.length; q++)
                        if (toAddresses[q].address.equals( blocksConfirmed[i].blockInformationMinersInstances[j].address )){
                            found = true;

                            toAddresses[q].amount += blocksConfirmed[i].blockInformationMinersInstances[j].reward;

                            break;
                        }

                    if (!found)
                        toAddresses.push({
                            address: blocksConfirmed[i].blockInformationMinersInstances[j].minerInstance.miner.address,
                            amount: blocksConfirmed[i].blockInformationMinersInstances[j].reward,
                        });
                }


            }

            let transaction = await Blockchain.Transactions.wizard.createTransactionSimple( this.poolManagement.mining.minerAddress, toAddresses, undefined, consts.MINING_POOL.MINING.FEE_THRESHOLD, );

            if (!transaction.result) throw {message: "Transaction was not made"};


            for (let i=0; i<blocksConfirmed.length; i++) {

                for (let j = 0; j < blocksConfirmed[i].blockInformationMinersInstances.length; j++) {


                    blocksConfirmed[i].blockInformationMinersInstances[j].minerInstance.miner.rewardSent += blocksConfirmed[i].blockInformationMinersInstances[j].reward;
                    blocksConfirmed[i].blockInformationMinersInstances[j].minerInstance.miner.rewardTotal -= blocksConfirmed[i].blockInformationMinersInstances[j].reward;
                    blocksConfirmed[i].blockInformationMinersInstances[j].reward = 0;

                }

                blocksConfirmed[i].payout = true;

            }


        } catch (exception){

            console.error("Pool Payouts raised an error", exception);
            return false;

        }

        return true;

    }

}

export default PoolPayouts