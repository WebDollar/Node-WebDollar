import BufferExtended from "common/utils/BufferExtended";
import StatusEvents from "common/events/Status-Events";

import consts from 'consts/const_global'

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import InterfaceBlockchainAddressHelper from "../addresses/Interface-Blockchain-Address-Helper";
import AdvancedMessages from "../../../../node/menu/Advanced-Messages";
import Blockchain from "../../../../main-blockchain/Blockchain";

class InterfaceBlockchainMiningBasic {

    constructor(blockchain, minerAddress, miningFeePerByte){

        this._minerAddress = undefined;
        this._unencodedMinerAddress = undefined;

        this.blockchain = blockchain;

        if ( minerAddress )
            this.minerAddress = minerAddress;

        if (miningFeePerByte === undefined) miningFeePerByte = consts.MINING_POOL.MINING.FEE_PER_BYTE;
        this.miningFeePerByte = miningFeePerByte;

        this._nonce = 0;
        this.started = false;
        this._hashesPerSecond = 0;

        this.walletDB = new InterfaceSatoshminDB(consts.DATABASE_NAMES.WALLET_DATABASE);

        this._intervalMiningOutput = undefined;

        this.useResetConsensus = true;

        this.resetForced = false;
        this._intervalPerMinute = false;
    }

    get minerAddress(){
        return this._minerAddress;
    }

    get unencodedMinerAddress(){
        return this._unencodedMinerAddress;
    }

    set minerAddress(newAddress){
        return this._setAddress(newAddress, true)
    }

    set miningFeePerByte(newFee){
        this._miningFeePerByte = newFee;
    }

    get miningFeePerByte(){
        return this._miningFeePerByte;
    }

    _setAddress(newAddress, save = true){

        if (typeof newAddress === "object" && newAddress.hasOwnProperty("address"))
            newAddress = newAddress.address;

        if (Buffer.isBuffer(newAddress))
            newAddress = BufferExtended.toBase(newAddress);

        this._minerAddress = newAddress;

        if (newAddress === undefined)
            this._unencodedMinerAddress = undefined;
        else
            this._unencodedMinerAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(newAddress);

        StatusEvents.emit( 'blockchain/mining/address', { address: this._minerAddress, unencodedAddress: this._unencodedMinerAddress});

        if (!save)
            return true;
        else
            return this.saveMinerAddress();
    }

    async saveMinerAddress(minerAddress){

        if (minerAddress)
            minerAddress = this.minerAddress;

        if (typeof minerAddress === "object" && minerAddress.hasOwnProperty("address"))
            minerAddress = minerAddress.address;

        let key = "minerAddress";

        try {

            return (await this.walletDB.save(key, minerAddress));
        }
        catch(err) {
            console.error('ERROR on SAVE miner address: ', err);
            return false;
        }

    }

    async loadMinerAddress(defaultAddress, Wallet){

        let key = "minerAddress";

        try {
            let minerAddress = await this.walletDB.get(key);

            if (minerAddress === null || minerAddress === undefined) {
                this.minerAddress = defaultAddress;
                return true;
            }

            if ( Wallet.getAddress( minerAddress ) === null ){
                if (typeof window === "undefined"){

                    console.error("You are mining on an address that is not in your wallet. Do you want to change the mining address on your wallet?")

                } else {

                    let confirmation = confirm("You are mining on an address that is not in your wallet. Do you want to change the mining address on your wallet?");

                    if (confirmation) {
                        minerAddress = Wallet.addresses[0];
                        this._setAddress(minerAddress, true);
                    }
                }

            }


            this._setAddress(minerAddress, false);

            return true;
        }
        catch(err) {
            console.error( 'ERROR on LOAD miner address: ', err);
            return false;
        }
    }









    async startMining(){

        if (this.started)
            return;

        this.started = true;
        this.reset = false;

        StatusEvents.emit('mining/status-changed', true);

        if ( !this.minerAddress ){

            AdvancedMessages.alert("Mining suspended. No Mining Address", "Mining Error", "error", 5000);
            this.stopMining();

            return false;
        }

        this._startMiningHashRateInterval();

        await this.mineNextBlock();

    }

    stopMining(){

        this.started = false;
        StatusEvents.emit('mining/status-changed', false);

        this._destroyMiningInterval();
    }

    resetMining(){
        this.reset = true;

        StatusEvents.emit('mining/reset', true);
    }

    _startMiningHashRateInterval(){

        if (this._intervalMiningOutput !== undefined) return;

        let count = 0;
        this._intervalMiningOutput = setInterval(() => {

            count ++;

            if (!this._intervalPerMinute ){
                console.log(this._hashesPerSecond + " hashes/s");
                StatusEvents.emit("mining/hash-rate", this._hashesPerSecond);
                this._hashesPerSecond = 0;
            } else if ( count % 30 === 0 ) {

                console.info("-------------------------------------");
                console.info("-------------------------------------");
                console.info("-------------------------------------");
                console.info(this._hashesPerSecond/30 + " hashes/s");
                console.info("-------------------------------------");
                console.info("-------------------------------------");
                console.info("-------------------------------------");
                StatusEvents.emit("mining/hash-rate", this._hashesPerSecond);
                this._hashesPerSecond = 0;
            } else {
                if (this._hashesPerSecond > 0)
                    console.log("mining....");
            }

        }, 1000);
    }




    async mineNextBlock(suspend){
        //overwritten
    }

    _destroyMiningInterval(){

        if (this._intervalMiningOutput !== undefined) {

            clearInterval(this._intervalMiningOutput);
            this._intervalMiningOutput = undefined;

            this._hashesPerSecond = 0;

        }

    }

    // if it is in terminal asking for the password (required in POS)
    async setPrivateKeyAddressForMiningAddress(){

        let foundAddress = Blockchain.Wallet.getAddress(this.minerAddress);

        let password = await foundAddress.getPrivateKey();

        if (password){
            foundAddress._privateKeyForMining = password;
            console.warn("Mining Address ready for mining" + this.minerAddress );
        } else {
            console.warn("Password is invalid");
            return false;
        }

        return true;
    }

}

export default InterfaceBlockchainMiningBasic;