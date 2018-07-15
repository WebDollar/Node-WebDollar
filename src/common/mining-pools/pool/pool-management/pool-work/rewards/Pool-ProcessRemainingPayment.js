import Blockchain from "main-blockchain/Blockchain";

import consts from 'consts/const_global'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

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

        console.info("--------------------------------------------------");
        console.info("--------------------------------------------------");
        console.info("--------------------------------------------------");
        console.info("--------------------------------------------------");
        console.info("------------------Remained PAYOUT-----------------");
        console.info("--------------------------------------------------");
        console.info("--------------------------------------------------");
        console.info("--------------------------------------------------");
        console.info("--------------------------------------------------");

        try{

            this.createRemainPayouts();

            if(!this.prepareRewards()) throw {message: "No Addresses to send money"};

            await this.createTransactions();

            console.info("Payout: Transaction Created");

            this.updateMinersReward();

        } catch (exception){

            console.error("----------------------------------------");
            console.error("Pool Payouts raised an error", exception);
            console.error("----------------------------------------");

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
        let poolCurrentBalance = 28000000000;

        let restantAmount = poolCurrentBalance - (poolCurrentBalance + poolRewardSCO) * this.poolFeePercent;

        console.log("I have to pay "+restantAmount/WebDollarCoins.WEBD+" WEBD from " + poolCurrentBalance/WebDollarCoins.WEBD);

        this.poolData.miners.forEach((miner)=>{

            let percentAlreadyPaid = (miner._rewardSent + miner._rewardConfirmedOther) / (this.totalRewardSent + this.totalRewardConfirmOther);

            if(percentAlreadyPaid * restantAmount >= 10*WebDollarCoins.WEBD){

                this._addAddressTo(miner.address).amount = percentAlreadyPaid * restantAmount;
                console.log("Will pay " + (percentAlreadyPaid * restantAmount)/WebDollarCoins.WEBD.toFixed(0) + " WEBD to " + InterfaceBlockchainAddressHelper.generateAddressWIF(miner.address,false,true));
            }

        });

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

        let index = 0;
        while (index * 256 < this._toAddresses.length) {

            let toAddresses = this._toAddresses.slice(index*255, (index+1)*255);

            try {
                let transaction = await Blockchain.Transactions.wizard.createTransactionSimple(this.blockchain.mining.minerAddress, toAddresses, undefined, consts.MINING_POOL.MINING.FEE_THRESHOLD,);
                if (!transaction.result) throw {message: "Transaction was not made"};
            } catch (exception){
                console.error("Payout: ERROR CREATING TRANSACTION");
            }

            index++;
        }

    }

    updateMinersReward(){

        for (let i=0; i<this._toAddresses.length; i++){

            let miner = this.poolData.findMiner( this._toAddresses[i].address );
            if (miner === null) console.error("ERROR! Miner was not found at the payout");

            miner.rewardSent += this._toAddresses[i].amount; //i paid totally
            miner.rewardConfirmed = 0; //paid this
            miner.rewardConfirmedOther = 0; //paid this

            miner.__tempRewardConfirmedOther = 0; //paid this

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