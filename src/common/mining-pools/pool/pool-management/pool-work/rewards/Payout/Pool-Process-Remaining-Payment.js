import Blockchain from "main-blockchain/Blockchain";

import consts from 'consts/const_global'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import Log from 'common/utils/logging/Log';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

class PoolRewardsManagement{

    constructor(poolManagement, poolData, blockchain){

        this.poolManagement = poolManagement;
        this.poolData = poolData;

        this.blockchain = blockchain;
        this._payoutInProgress = false;

        this.poolFeePercent = poolManagement.poolSettings._poolFee;
        this.currentPoolBalance = 0;

        this.totalRewardSent = 0;
        this.totalRewardConfirmOther = 0;

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

        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("------------------Remained PAYOUT-----------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);
        Log.info("--------------------------------------------------", Log.LOG_TYPE.POOLS);

        try{

            this.createRemainPayouts();

            if (!this.prepareRewards()) throw {message: "No Addresses to send money"};

            await this.createTransactions();

            Log.info("Payout: Transaction Created", Log.LOG_TYPE.POOLS);

            this.updateMinersReward();

        } catch (exception){

            Log.error("----------------------------------------", Log.LOG_TYPE.POOLS);
            Log.error("Pool Payouts raised an error", exception, Log.LOG_TYPE.POOLS);
            Log.error("----------------------------------------", Log.LOG_TYPE.POOLS);

            return false;

        }

        return true;

    }

    createRemainPayouts(){

        this.poolData.miners.forEach((miner)=>{

            this.totalRewardSent += miner._rewardSent ;
            this.totalRewardConfirmOther += miner._rewardConfirmedOther;

        });

        let poolRewardSCO = this.totalRewardSent + this.totalRewardConfirmOther;
        let poolCurrentBalance = Blockchain.blockchain.accountantTree.getBalance(this.blockchain.mining.minerAddress, undefined);



        poolCurrentBalance -= BlockchainMiningReward.getReward(this.blockchain.blocks.length-1) * this.poolData.confirmedBlockInformations.length;

        let remainingAmount = Math.floor( poolCurrentBalance - (poolCurrentBalance + poolRewardSCO) * this.poolFeePercent - this.totalRewardConfirmOther );

        if (remainingAmount <= 0){
            Log.error("Can not Pay the Remaning money because you don't have enough funds or you already paid all the users", Log.LOG_TYPE.POOLS);
            return;
        }

        Log.info("I have to pay "+remainingAmount/WebDollarCoins.WEBD+" WEBD from " + poolCurrentBalance/WebDollarCoins.WEBD, Log.LOG_TYPE.POOLS);

        let sumTotal = 0;

        this.poolData.miners.forEach((miner)=>{

            let percentAlreadyPaid = miner._rewardSent / this.totalRewardSent;
            let reward = Math.floor( percentAlreadyPaid * remainingAmount + miner._rewardConfirmedOther );

            if ( reward >= consts.MINING_POOL.MINING.MINING_POOL_MINIMUM_PAYOUT){

                this._addAddressTo(miner.address).amount = reward;
                //Log.info("Will pay " + reward/WebDollarCoins.WEBD.toFixed(0) + " WEBD to " + InterfaceBlockchainAddressHelper.generateAddressWIF(miner.address,false,true), Log.LOG_TYPE.POOLS);

                sumTotal+= reward
            }

        });

        Log.info("Total to pay " + sumTotal/WebDollarCoins.WEBD.toFixed(0), Log.LOG_TYPE.POOLS );

    }

    prepareRewards(){

        //verify to send to other
        if (this._toAddresses.length === 0) return false;

        //let's floor the data
        for (let i=0; i < this._toAddresses.length; i++)
            this._toAddresses[i].amount = Math.floor( this._toAddresses[i].amount );

        return true;

    }

    async createTransactions(){

        //let's reduce the amounts with the fees
        let sumTotal = 0;

        for (let i=this._toAddresses.length-1; i>=0; i--){
            this._toAddresses[i].amount = Math.floor( this._toAddresses[i].amount);

            if (this._toAddresses[i].amount < consts.MINING_POOL.MINING.MINING_POOL_MINIMUM_PAYOUT){

                let miner = this.poolData.findMiner( this._toAddresses[i].address );
                miner.rewardConfirmedOther += Math.max(0, this._toAddresses[i].amount);

                this._toAddresses.splice(i, 1);
            } else {
                Log.info("Will pay " + this._toAddresses[i].amount / WebDollarCoins.WEBD + " WEBD to " + InterfaceBlockchainAddressHelper.generateAddressWIF(this._toAddresses[i].address, false, true), Log.LOG_TYPE.POOLS);
                sumTotal += this._toAddresses[i].amount;
            }

        }

        this._removeAddressTo(this.blockchain.mining.unencodedMinerAddress);

        Log.info("Total to pay " + sumTotal/WebDollarCoins.WEBD.toFixed(0), Log.LOG_TYPE.POOLS );


        let index = 0;
        while (index * 256 < this._toAddresses.length) {

            let toAddresses = this._toAddresses.slice(index*255, (index+1)*255);

            try {
                let transaction = await Blockchain.Transactions.wizard.createTransactionSimple(this.blockchain.mining.minerAddress, toAddresses, undefined, 0, );
                if (!transaction.result) throw {message: "Transaction was not made"};
            } catch (exception){
                Log.error("Payout: ERROR CREATING TRANSACTION", Log.LOG_TYPE.POOLS);
            }

            index++;
        }

        Log.info("Payout: Transactions made  "+ index, Log.LOG_TYPE.POOLS);

    }

    updateMinersReward(){

        for (let i=0; i<this._toAddresses.length; i++){

            let miner = this.poolData.findMiner( this._toAddresses[i].address );
            if ( !miner ) Log.error("ERROR! Miner was not found at the payout", Log.LOG_TYPE.POOLS);

            miner.rewardSent += this._toAddresses[i].amount; //i paid totally
            miner.rewardConfirmedOther = 0; //paid this


        }

        this._toAddresses=[];

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

export default PoolRewardsManagement