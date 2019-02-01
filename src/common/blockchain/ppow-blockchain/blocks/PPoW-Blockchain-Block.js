const BigInteger = require('big-integer');

import consts from 'consts/const_global';
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import Convert from 'common/utils/Convert';
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data';

class PPoWBlockchainBlock extends InterfaceBlockchainBlock{

    constructor (blockchain, blockValidation, version, hash, hashPrev, hashChain, timeStamp, nonce, data, height, db) {

        super(blockchain, blockValidation, version, hash, hashPrev, hashChain, timeStamp, nonce, data, height, db);

        //first pointer is to Genesis
        this._level = undefined;
        this.interlink = undefined;
        this._provesClculatedInserted = undefined;
    }

    destroyBlock(){

        //in case it was already included
        if (this.blockchain === undefined) return;

        if (this._provesClculatedInserted)
            this.blockchain.prover.provesCalculated.deleteBlock(this);

        InterfaceBlockchainBlock.prototype.destroyBlock.call(this);
    }

    updateInterlink(){
        this.interlink = this.calculateInterlink();
    }

    getLevel(){

        if (this._level !== undefined) return this._level;

        //we use difficultyTargetPrev instead of current difficultyTarget
        let T = this.difficultyTargetPrev;

        if ( this.height === 0 )
            T = BlockchainGenesis.difficultyTarget;
        else
        if ( this.height === consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION )
            T = BlockchainGenesis.difficultyTargetPOS;


        if (T === undefined || T === null) throw {message: "Target is not defined"};

        if (Buffer.isBuffer(T))
            T = Convert.bufferToBigIntegerHex(T);

        let id = Convert.bufferToBigIntegerHex(this.hash);

        //If id <= T/2^u the block is of level u => block level is max(u) for 2^u * id <= T
        // T -> inf => u -> 255
        let u = 0;
        let pow = new BigInteger("1", 16);

        while(pow.multiply(id).compare(T) <= 0) {
            ++u;
            pow = pow.multiply(2);
        }
        --u;

        //console.log('L=', u);
        //console.log('P=', id.multiply(1 << u).toString());

        this._level = u;

        return u;
    }

    /**
     * Algorithm 1
     */
    calculateInterlink(){

        if (this.blockValidation.blockValidationType["skip-interlinks-update"] === true) return this.interlink;

        let interlink = [{height: -1, blockId: BlockchainGenesis.hashPrev}];
        if (this.height === 0) return interlink;

        let blockLevel = 0;
        // interlink = interlink'
        let prevBlock = this.blockValidation.getBlockCallBack( this.height );

        if (prevBlock === BlockchainGenesis) blockLevel = 0;
        else
        if ( prevBlock ) {
            for (let i = 0; i < prevBlock.interlink.length; ++i)
                interlink[i] = prevBlock.interlink[i];
            blockLevel = prevBlock.getLevel();
        }

        //add new interlinks for current block
        //Every block of level u needs a pointer to the previous block with level <= u.

        for (let i = 1; i <= blockLevel; ++i){

            if (i > interlink.length)
                interlink.push({});

            interlink[i] = {height: prevBlock.height, blockId: prevBlock.hash }; //getId = Hash

        }

        return interlink;

    }

    _validateInterlink() {

        //validate interlinks array
        let level = this.interlink.length-1;
        while (level >= 0){

            let link = this.interlink[level];
            let linkedBlock = this.blockValidation.getBlockCallBack(link.height+1);

            if (level !== 0) {
                if (! BufferExtended.safeCompare(linkedBlock.hash, link.blockId))
                    throw {message: "Interlink to Genesis is wrong! "};

                let linkedBlockLevel = linkedBlock.getLevel();

                if (linkedBlockLevel < level )
                    throw {message: "Interlink level error", level: level}

                //TODO verify that the interlinks are actually the last on the same level

            } else {

                if (linkedBlock !== BlockchainGenesis || this.interlink[0].height !== -1 || ! BufferExtended.safeCompare(this.interlink[0].blockId, BlockchainGenesis.hashPrev))
                    throw {message: "Interlink to Genesis is wrong! "}

            }

            level--;


        }

        return true;
    }

    _supplementaryValidation() {
        return this.validateBlockInterlinks();
    }

    _computeBlockHeaderPrefix(requestHeader){

        return Buffer.concat ( [
            InterfaceBlockchainBlock.prototype._computeBlockHeaderPrefix.call(this, requestHeader),
            this._serializeInterlink(),
        ]);

    }

    _serializeInterlink(){

        let list = [Serialization.serializeNumber1Byte(this.interlink.length)];

        for (let i = 0; i < this.interlink.length; i++) {

            //optimize storage
            if (i > 0 && this.interlink[i-1].height === this.interlink[i].height){
                list.push(Serialization.serializeNumber3Bytes(0));
            } else {
                let heightBuffer = Serialization.serializeNumber3Bytes(this.interlink[i].height + 2 );
                let blockIdBuffer = this.interlink[i].blockId;
                list.push(heightBuffer);
                list.push(blockIdBuffer);
            }

        }

        return Buffer.concat (list);
    }

    _deserializeInterlink(buffer, offset){

        try {

            let numInterlink = Serialization.deserializeNumber1Bytes( buffer, offset );
            offset += 1;

            this.interlink = [];
            for (let i = 0; i < numInterlink; ++i) {

                let height = Serialization.deserializeNumber3Bytes( buffer, offset );
                offset += 3;

                if (height === 0) {
                    this.interlink.push(this.interlink[i-1]);
                } else {
                    let blockId = BufferExtended.substr(buffer, offset, 32);
                    offset += 32;

                    this.interlink.push( {height: height - 2, blockId: blockId} );
                }
            }

        } catch (exception){
            console.log("Error deserialize interlink. ", exception);
            throw exception;
        }

        return offset;
    }

    deserializeBlock(buffer, height, reward, difficultyTargetPrev,  offset = 0, blockLengthValidation , onlyHeader , usePrevHash){


        offset = InterfaceBlockchainBlock.prototype.deserializeBlock.apply(this, arguments);

        try {

            offset = this._deserializeInterlink(buffer, offset);

        } catch (exception){

            console.error("error deserialize a NiPoPoW block  ", exception, buffer);
            throw exception;

        }

        return offset;
    }

    _interlinksToJSON(interlinks){

        let data = [];

        let prevInterlink = null;
        for (let i = 0; i < interlinks.length; i++) {

            if (prevInterlink !== null && prevInterlink.blockId.equals(interlinks[i].blockId)){
                data.push(0);
            } else
                data.push({
                    h: interlinks[i].height,
                    bId: interlinks[i].blockId.toString("hex"),
                });

            prevInterlink = this.interlink[i];
        }

        return data;
    }

    _importInterlinksFromJSON(interlinks){

        let data = [];

        let prevInterlink = null;

        for (let i = 0; i < interlinks.length; i++) {

            if (interlinks[i] === 0){
                data.push({
                    height:prevInterlink.h,
                    blockId: prevInterlink.bId,
                });
            } else {
                data.push({
                    height: interlinks[i].h||interlinks[i].height,
                    blockId: interlinks[i].bId||interlinks[i].blockId,
                });

                prevInterlink = interlinks[i];
            }
        }

        return data;
    }

    toJSON(){
        let answer = InterfaceBlockchainBlock.prototype.toJSON.call(this);

        answer.interlinks = this._interlinksToJSON(this.interlink);

        return answer;
    }

    getBlockHeader(){

        let answer = InterfaceBlockchainBlock.prototype.getBlockHeader.call(this);

        answer.interlinks = this._interlinksToJSON(this.interlink);

        return answer;
    }

    importBlockFromHeader(json){

        this.interlink = this._importInterlinksFromJSON(json.interlinks);

        return InterfaceBlockchainBlock.prototype.importBlockFromHeader.call(this, json);

    }


    validateBlockInterlinks(){

        if (!this.blockValidation.blockValidationType["skip-validation-interlinks"]) {

            let interlink = this.calculateInterlink();

            if (interlink.length !== this.interlink.length)
                throw {message: "interlink has different sizes"};

            for (let i = 0; i < interlink.length; i++) {
                if (interlink[i].height !== this.interlink[i].height)
                    throw {message: "interlink height is different"};

                if (!BufferExtended.safeCompare(interlink[i].blockId, this.interlink[i].blockId))
                    throw {message: "interlink prevBlock height is different"};
            }

        }


        return true;

    }

    async validateBlock(height){

        let answer = await InterfaceBlockchainBlock.prototype.validateBlock.call(this, height);

        if (!answer)
            return answer;

        this.validateBlockInterlinks();

        return true;

    }

}

export default PPoWBlockchainBlock;