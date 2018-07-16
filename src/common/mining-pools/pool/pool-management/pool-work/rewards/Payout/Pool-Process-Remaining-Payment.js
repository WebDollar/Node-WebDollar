import Blockchain from "main-blockchain/Blockchain";

import consts from 'consts/const_global'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import Log from 'common/utils/logging/Log';

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

        let remainingAmount = Math.floor( poolCurrentBalance - (poolCurrentBalance + poolRewardSCO) * this.poolFeePercent - this.totalRewardConfirmOther );

        Log.info("I have to pay "+remainingAmount/WebDollarCoins.WEBD+" WEBD from " + poolCurrentBalance/WebDollarCoins.WEBD, Log.LOG_TYPE.POOLS);

        let sumTotal = 0;

        this.poolData.miners.forEach((miner)=>{

            let percentAlreadyPaid = miner._rewardSent / this.totalRewardSent;
            let reward = Math.floor( percentAlreadyPaid * remainingAmount + miner._rewardConfirmedOther );

            if ( reward >= 20*WebDollarCoins.WEBD){

                this._addAddressTo(miner.address).amount = reward;
                Log.info("Will pay " + reward/WebDollarCoins.WEBD.toFixed(0) + " WEBD to " + InterfaceBlockchainAddressHelper.generateAddressWIF(miner.address,false,true), Log.LOG_TYPE.POOLS);

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

        let total = consts.MINING_POOL.MINING.FEE_THRESHOLD * this._toAddresses.length/255;
        let fee = total / this._toAddresses.length;

        //let's reduce the amounts with the fees
        for (let i=this._toAddresses.length-1; i>=0; i--){
            this._toAddresses[i].amount = Math.floor( this._toAddresses[i].amount - fee );

            if (this._toAddresses[i].amount < 20*WebDollarCoins.WEBD){

                let miner = this.poolData.findMiner( this._toAddresses[i].address );
                miner.rewardConfirmedOther += Math.max(0, this._toAddresses[i].amount);

                this._toAddresses.splice(i, 1);
            }

        }


        let index = 0;
        while (index * 256 < this._toAddresses.length) {

            let toAddresses = this._toAddresses.slice(index*255, (index+1)*255);

            try {
                let transaction = await Blockchain.Transactions.wizard.createTransactionSimple(this.blockchain.mining.minerAddress, toAddresses, undefined, consts.MINING_POOL.MINING.FEE_THRESHOLD, );
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
            if (miner === null) Log.error("ERROR! Miner was not found at the payout", Log.LOG_TYPE.POOLS);

            miner.rewardSent += this._toAddresses[i].amount; //i paid totally
            miner.rewardConfirmed = 0; //paid this
            miner.rewardConfirmedOther = 0; //paid this


        }

        this._toAddresses=[];

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

export default PoolRewardsManagement