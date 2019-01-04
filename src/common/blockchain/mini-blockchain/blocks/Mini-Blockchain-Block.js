import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended";

import InterfaceBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import PPoWBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import Serialization from "common/utils/Serialization";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import Blockchain from "main-blockchain/Blockchain"

import ed25519 from "common/crypto/ed25519";
import InterfaceBlockchainAddressHelper from "../../interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import InterfaceBlockchainBlock from "../../interface-blockchain/blocks/Interface-Blockchain-Block";
const BigInteger = require('big-integer');

let inheritBlockchainBlock;

if (consts.POPOW_PARAMS.ACTIVATED) inheritBlockchainBlock = PPoWBlock;
else  inheritBlockchainBlock = InterfaceBlock;


class MiniBlockchainBlock extends inheritBlockchainBlock {

    constructor(blockchain, blockValidation, version, hash, hashPrev, hashChain, timeStamp, nonce, data, height, db, posMinerAddress, posMinerPublicKey, posSignature ){

        super(blockchain, blockValidation, version, hash, hashPrev, hashChain, timeStamp, nonce, data, height, db);

        if ( BlockchainGenesis.isPoSActivated(this.height) ){

            this.posMinerAddress = posMinerAddress||undefined; //the address where it should be mined
            this.posMinerPublicKey = posMinerPublicKey||undefined; //the public key to validate the signature
            this.posSignature = posSignature||undefined; //the signature

        }

    }

    getBlockHeader(){

        let json = inheritBlockchainBlock.prototype.getBlockHeader.call(this);

        json.data.hashAccountantTree = this.data.hashAccountantTree;

        return json;
    }

    importBlockFromHeader(json){

        this.data.hashAccountantTree = json.data.hashAccountantTree;

        return inheritBlockchainBlock.prototype.importBlockFromHeader.call(this, json);
    }


    computeHash(newNonce){

        if ( BlockchainGenesis.isPoSActivated(this.height) )
            return this.computeHashPOS();
        else
            return this.computeHashPOW(newNonce);

    }

    _getHashPOWData(newNonce){

        if (!BlockchainGenesis.isPoSActivated(this.height - 1))
            return inheritBlockchainBlock.prototype._getHashPOWData.call(this, newNonce);

        let data = inheritBlockchainBlock.prototype._getHashPOWData.call(this, newNonce);

        if ( BlockchainGenesis.isPoSActivated(this.height - 1) )
            data = Buffer.concat([
                    data,
                    this.blockValidation.getBlockCallBack(this.height).posSignature,
                ]);

        return data;

    }

    /**
     *
     * SHA256(prevhash + address + timestamp) <= 2^256 * balance / diff
     *
     * hashPrev not chainHash to avoid attacks with multiple changes in the block
     * signature is not included to avoid attacks changing signatures or timestamp
     *
     */
    async computeHashPOS(){

        try {

            //  SHA256(prevhash + address + timestamp) <= 2^256 * balance / diff

            let buffer = Buffer.concat([

                Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.height) ),
                Serialization.serializeBufferRemovingLeadingZeros( this.difficultyTargetPrev ),
                Serialization.serializeBufferRemovingLeadingZeros( this.hashPrev ),
                Serialization.serializeBufferRemovingLeadingZeros( this.posMinerAddress || this.data.minerAddress ),
                Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.timeStamp) ),

            ]);

            let hash = await WebDollarCrypto.SHA256(buffer);

            let balance = Blockchain.blockchain.accountantTree.getBalance(this.posMinerAddress || this.data.minerAddress);

            //reward already included in the new balance
            if (Blockchain.blockchain.accountantTree.root.hash.sha256.equals( this.data.hashAccountantTree ) && balance !== null) {

                if (this.posMinerAddress === undefined) { //in case it was sent to the minerAddress
                    balance -= this.reward;
                    balance -= this.data.transactions.calculateFees();
                }

                this.data.transactions.transactions.forEach((tx)=>{

                    tx.from.addresses.forEach((from)=>{
                        if ( from.unencodedAddress.equals( this.data.minerAddress ))
                            balance += from.amount;
                    });

                    tx.to.addresses.forEach((to)=>{
                        if ( to.unencodedAddress.equals( this.data.minerAddress ))
                            balance -= to.amount;
                    });

                });

            }

            if (balance === null || balance === 0)
                return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER;

            let number = new BigInteger( hash.toString("hex"), 16);

            let hex = number.divide( balance ).toString(16);
            if (hex.length % 2 === 1) hex = "0"+hex;

            return Serialization.serializeToFixedBuffer( consts.BLOCKCHAIN.BLOCKS_POW_LENGTH, Buffer.from( hex , "hex")  );

        } catch (exception){
            console.error("Error computeHash", exception);
            //return Buffer.from( consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER);
            throw exception;
        }
    }

    async _signPOSSignature () {

        let address =  Blockchain.Wallet.getAddress( { unencodedAddress: this.posMinerAddress || this.data.minerAddress } );

        if (address === null)
            if( typeof this.data.minerAddress !== "undefined")
                throw {message: "Can not sign POS because the address doesn't exist in your wallet " + (this.posMinerAddress||this.data.minerAddress).toString('hex') };
            else
                throw {message: "Can not sign POS because the address doesn't exist in your wallet"};

        let data = this._computeBlockHeaderPrefix( true );
        let answer = await address.signMessage ( data, undefined, true );

        //storing the publicKey
        this.posMinerPublicKey = answer.publicKey;

        return answer.signature;

    }

    async _verifyPOSSignature(){

        if ( !InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(this.posMinerPublicKey, false).equals( this.posMinerAddress || this.data.minerAddress  ) )
            throw { message: "posPublicKey doesn't match with the minerAddress" }

        let data = this._computeBlockHeaderPrefix( true );

        let answer = await ed25519.verify( this.posSignature, data , this.posMinerPublicKey );

        if (!answer)
            throw {message: "POS Signature is invalid"};

        return true;

    }

    async _validateHash() {

        await inheritBlockchainBlock.prototype._validateHash.call(this);

        if ( BlockchainGenesis.isPoSActivated(this.height) ){

            if ( !this.blockValidation.blockValidationType['skip-validation-PoS-signature'] )
                await this._verifyPOSSignature();

        }

        return true;

    }

    //used for serialization
    _calculateSerializedBlock(requestHeader = false){

        if ( BlockchainGenesis.isPoSActivated(this.height) ){

            let buffers = [
                this.hash,
                this.posMinerPublicKey,
                this.posSignature,
            ];

            if ( this.posMinerAddress === undefined)
                buffers.push(new Buffer(1));
            else {

                buffers.push(Serialization.serializeNumber1Byte(this.posMinerAddress.length));
                buffers.push(this.posMinerAddress);

            }

            buffers.push(this._computeBlockHeaderPrefix( requestHeader ));

            return Buffer.concat(buffers);

        } else
            return inheritBlockchainBlock.prototype._calculateSerializedBlock.call( this, requestHeader );

    }

    _deserializeBlock(buffer, offset){

        if ( BlockchainGenesis.isPoSActivated(this.height) ){

            this.hash = BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
            offset += consts.BLOCKCHAIN.BLOCKS_POW_LENGTH;

            this.posMinerPublicKey = BufferExtended.substr(buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH);
            offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

            this.posSignature = BufferExtended.substr(buffer, offset, consts.TRANSACTIONS.SIGNATURE_SCHNORR.LENGTH);
            offset += consts.TRANSACTIONS.SIGNATURE_SCHNORR.LENGTH;

            let minerAddressLength = Serialization.deserializeNumber1Bytes(buffer, offset);
            offset += 1;

            if (minerAddressLength !== 0 && minerAddressLength !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "minerAddress is invalid"};

            if (minerAddressLength === 0) this.posMinerAddress = undefined;
            else this.posMinerAddress = BufferExtended.substr(buffer, offset, minerAddressLength);

            offset += minerAddressLength;

            return offset;

        } else
            return inheritBlockchainBlock.prototype._deserializeBlock.call(this, buffer, offset);
    }


    calculateNewChainHash(){

        if ( BlockchainGenesis.isPoSActivated(this.height) )
            return WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( this._calculateSerializedBlock( true ) ));
        else
            return InterfaceBlockchainBlock.prototype.calculateNewChainHash.call(this);

    }

}

export default MiniBlockchainBlock