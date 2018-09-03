import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended";

import InterfaceBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import PPoWBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import Serialization from "common/utils/Serialization";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import Blockchain from "main-blockchain/Blockchain"

import ed25519 from "common/crypto/ed25519";

let inheritBlockchainBlock;

if (consts.POPOW_PARAMS.ACTIVATED) inheritBlockchainBlock = PPoWBlock;
else  inheritBlockchainBlock = InterfaceBlock;


class MiniBlockchainBlock extends inheritBlockchainBlock {

    constructor(blockchain, blockValidation, version, hash, hashPrev, timeStamp, nonce, data, height, db, posMinerAddress, posMinerPublicKey, posSignature ){

        super(blockchain, blockValidation, version, hash, hashPrev, timeStamp, nonce, data, height, db);

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

    async _getHashPOWData(newNonce){

        if (!BlockchainGenesis.isPoSActivated(this.height + 1))
            return inheritBlockchainBlock.prototype._getHashPOWData.call(this, newNonce);

        let data = await inheritBlockchainBlock.prototype._getHashPOWData.call(this, newNonce);

        if ( BlockchainGenesis.isPoSActivated(this.height + 1) )
            data = Buffer.concat([
                    data,
                    this.blockValidation.getBlockCallBack(this.height).posSignature,
                ]);

        return data;

    }

    async computeHashPOS(){

        try {

            //  SHA256(prevhash + address + timestamp) <= 2^256 * balance / diff

            let buffer = Buffer.concat([

                Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.height) ),
                Serialization.serializeBufferRemovingLeadingZeros( this.difficultyTargetPrev ),
                Serialization.serializeBufferRemovingLeadingZeros( this.hashPrev ),
                Serialization.serializeBufferRemovingLeadingZeros( this.posMinerAddress || this.data.minerAddress ),
                Serialization.serializeBufferRemovingLeadingZeros( this.timeStamp ),

            ]);

            if ( BlockchainGenesis.isPoSActivated(this.height + 1) )
                buffer.push( this.blockValidation.getBlockCallBack(this.height).posSignature );

            return await WebDollarCrypto.SHA256(buffer);

        } catch (exception){
            console.error("Error computeHash", exception);
            return Buffer.from( consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER);
        }
    }

    async _signPOSSignature(){

        if (this.computedBlockPrefix === null)
            this._computeBlockHeaderPrefix();

        let data = this.computedBlockPrefix;

        let address =  Blockchain.Wallet.getAddress(this.posMinerAddress || this.data.minerAddress );

        if (address === null) throw {message: "Can not sign POS because the address doesn't exist in your wallet"};

        return await address.signMessage ( data, undefined, true );

    }

    async _verifyPOSSignature(){

        if (this.computedBlockPrefix === null)
            this._computeBlockHeaderPrefix();

        let data = this.computedBlockPrefix;

        let answer = await ed25519.verify( this.posSignature, data , this.posMinerPublicKey );

        if (!answer) throw {message: "POS Signature is invalid"};

        return true;

    }

    async _validateBlockHash() {

        await inheritBlockchainBlock.prototype._validateBlockHash.call(this);

        if ( BlockchainGenesis.isPoSActivated(this.height) ){

            if ( !this.blockValidation.blockValidationType['skip-validation-PoS-signature'] )
                await this._verifyPOSSignature();

            if ( !Buffer.isBuffer(this.posMinerAddress) ) throw {message: "posMinerAddress is invalid"};

            if ( this.posMinerAddress.length !== 0 && this.posMinerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "posMinerAddress length is invalid"};

        }

    }

    //used for serialization
    _calculateSerializedBlock(){

        if ( BlockchainGenesis.isPoSActivated(this.height) ){

            let buffers = [
                this.hash,
                this.posMinerPublicKey,
                this.posSignature,
            ];

            if ( this.posMinerAddress.length === 0 )
                buffers.push(new Buffer(0));
            else {

                buffers.push(Serialization.serializeNumber1Byte(this.posMinerAddress));
                buffers.push(this.posMinerAddress);

            }

            return Buffer.concat(buffers);

        } else
            return inheritBlockchainBlock.prototype._calculateSerializedBlock.call( this );

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

            if (minerAddressLength === 0) this.posMinerAddress = new Buffer(0);
            else this.posMinerAddress = BufferExtended.substr(buffer, offset, minerAddressLength);

            offset += minerAddressLength;

            return offset;

        } else
            return inheritBlockchainBlock.prototype._deserializeBlock(buffer, offset);
    }

}

export default MiniBlockchainBlock