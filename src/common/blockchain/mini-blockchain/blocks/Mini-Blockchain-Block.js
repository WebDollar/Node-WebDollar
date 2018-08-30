import consts from 'consts/const_global'

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

        this.posMinerAddress = posMinerAddress||undefined;
        this.posMinerPublicKey = posMinerPublicKey||undefined;
        this.posSignature = posSignature||undefined;

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
            return this.computeHashPOS( );
        else
            return this.computeHashPOW(newNonce);

    }

    async computeHashPOS(newNonce){

        try {

            //  SHA256(prevhash + address + timestamp) <= 2^256 * balance / diff

            if (this.computedBlockPrefix === null)
                return this._computeBlockHeaderPrefix();

            let buffer = Buffer.concat([

                Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.height) ),
                Serialization.serializeBufferRemovingLeadingZeros( this.difficultyTargetPrev ),
                Serialization.serializeBufferRemovingLeadingZeros( this.hashPrev ),
                Serialization.serializeBufferRemovingLeadingZeros( this.posMinerAddress || this.data.minerAddress ),
                Serialization.serializeBufferRemovingLeadingZeros( this.timeStamp ),

            ]);

            return await WebDollarCrypto.SHA256(buffer);

        } catch (exception){
            console.error("Error computeHash", exception);
            return Buffer.from( consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER);
        }
    }


    async _signPOSSignature(){

        if (this.computedBlockPrefix === null)
            return this._computeBlockHeaderPrefix();

        let data = this.computedBlockPrefix;

        let address =  Blockchain.Wallet.getAddress(this.posMinerAddress || this.data.minerAddress );

        if (address === null) throw {message: "Can not sign POS because the address doesn't exist in your wallet"};

        return await address.signMessage ( data, undefined, true );

    }

    async _verifyPOSSignature(){

        if (this.computedBlockPrefix === null)
            return this._computeBlockHeaderPrefix();

        let data = this.computedBlockPrefix;

        let answer = await ed25519.verify( this.posSignature, data , this.posMinerPublicKey );

        if (!answer) throw {message: "POS Signature is invalid"};

        return signature;

    }

}

export default MiniBlockchainBlock