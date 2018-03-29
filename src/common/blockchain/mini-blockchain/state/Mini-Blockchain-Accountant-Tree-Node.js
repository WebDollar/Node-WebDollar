import BufferExtended from "common/utils/BufferExtended";
import Serialization from "common/utils/Serialization";
import consts from 'consts/const_global'
import InterfaceMerkleRadixTreeNode from "common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree-Node"
import Blockchain from "main-blockchain/Blockchain"

let BigNumber = require('bignumber.js');

class MiniBlockchainAccountantTreeNode extends InterfaceMerkleRadixTreeNode{

    constructor (parent, edges, value){

        super(parent, edges);

        //console.log("value", value);
        this.hash = { sha256: new Buffer(32) };
        this.total = new BigNumber(0);

        this.nonce = 0;

        if (value !== undefined) {
            value = value || {};

            value.balances = value.balances||[];

            this.balances = value.balances;
            this.value = value;
        }

    }

    updateBalanceToken(value, tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH);
            tokenId[0] = 0x01;
        }

        if (this.balances === undefined || this.balances === null)
            throw {message: 'balances is null', amount: value, tokenId: tokenId };

        if (!Buffer.isBuffer(tokenId))
            tokenId = BufferExtended.fromBase(tokenId);

        if (value instanceof BigNumber === false)
            value = new BigNumber(value);

        let result;

        for (let i = 0; i < this.balances.length; i++)
            if (this.balances[i].id.equals( tokenId )) {
                this.balances[i].amount = this.balances[i].amount.plus(value) ;
                result = this.balances[i];
                break;
            }


        if (result === undefined && tokenId !== null){

            this.balances.push ({
                id: tokenId,
                amount: value,
            });

            result = this.balances[this.balances.length-1];
        }

        if ( result === undefined)
            throw { message: 'token is empty',  amount: value, tokenId: tokenId };

        if ( result.amount.isLessThan(0) )
            throw { message: 'balances became negative', amount: value, tokenId: tokenId };

        this._deleteBalancesEmpty();

        if (this.balances.length === 0)
            return null; //to be deleted

        return {
            tokenId: result.id,
            amount: result.amount,
        }

    }

    getBalance(tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH );
            tokenId[0] = 0x01;
        }

        if (!Buffer.isBuffer(tokenId))
            tokenId = BufferExtended.fromBase(tokenId);

        for (let i = 0; i < this.balances.length; i++)
            if (this.balances[i].id.equals( tokenId) )
                return this.balances[i].amount;

        return 0;

    }

    getBalances(){

        if (!this.isLeaf())
            return null;

        let list = { };

        for (let i = 0; i < this.balances.length; i++)
            list[ "0x"+this.balances[i].id.toString("hex") ] = this.balances[i].amount.toString();


        return list;
    }

    _deleteBalancesEmpty(){

        let result = false;
        for (let i = this.balances.length - 1; i >= 0; i--) {

            if (this.balances[i] === null || this.balances[i] === undefined || this.balances[i].amount.isEqualTo(0)) {
                this.balances.splice(i, 1);
                result = true;
            }
        }

        return true;

    }

    _serializeBalances(balances){

        return Buffer.concat(
            [
                Serialization.serializeToFixedBuffer(balances.id, consts.MINI_BLOCKCHAIN.TOKEN_ID_LENGTH),
                Serialization.serializeBigNumber(balances.amount)
            ]);

    }

    serializeNodeData( includeEdges, includeHashes ){

        try {
            let hash, balancesBuffers = [];

            hash = InterfaceMerkleRadixTreeNode.prototype.serializeNodeDataHash.apply(this, arguments);

            if (hash === null)
                hash = new Buffer(0);

            //console.log("buffer serializeNodeData hash", buffer.toString("hex"))

            let balancesCount = 0;
            if (this.balances !== undefined && this.balances !== null) {

                //let serialize webd
                let iWEBDSerialized = null;
                for (let i = 0; i < this.balances.length; i++)
                    if ((this.balances[i].id.length === 1) && (this.balances[i].id[0] === 1)) {
                        iWEBDSerialized = i;
                        break;
                    }

                // in case it was not serialize d and it is empty
                if (iWEBDSerialized === null) {
                    let idWEBD = new Buffer(consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH);
                    idWEBD[0] = 1;

                    balancesBuffers.push(this._serializeBalances({id: idWEBD, amount: new BigNumber(0)}));
                } else {
                    balancesBuffers.push(this._serializeBalances(this.balances[iWEBDSerialized]));
                }

                balancesCount = 1;

                //let serialize everything else
                for (let i = 0; i < this.balances.length; i++)
                    if (i !== iWEBDSerialized) {
                        balancesBuffers.push(this._serializeBalances(this.balances[i]));
                        balancesCount++;
                    }

                balancesBuffers = Buffer.concat(balancesBuffers);
            }

            if (Blockchain.blockchain.blocks.length > consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3_TRANSACTIONS.ACCOUNTANT_TREE)
                return Buffer.concat( [ hash, Serialization.serializeNumber2Bytes(this.nonce), Serialization.serializeNumber1Byte(balancesCount), balancesBuffers ] );
            else
                return Buffer.concat( [ hash, Serialization.serializeNumber1Byte(balancesCount), balancesBuffers ] );

        } catch (exception){
            console.log("Error Serializing MiniAccountantTree NodeData", exception);
            throw exception;
        }

    }

    deserializeNodeData(buffer, offset, includeEdges, includeHashes){

        // deserializing this.value
        offset = InterfaceMerkleRadixTreeNode.prototype.deserializeNodeDataHash.apply(this, arguments);

        if (Blockchain.blockchain.blocks.length > consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3_TRANSACTIONS.ACCOUNTANT_TREE){
            this.nonce = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 2) ); //1 byte
            offset += 2;
        }

        try {

            offset = offset || 0;

            let balancesLength = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) ); //1 byte
            offset += 1;

            if (balancesLength > 0){

                // webd balance
                let webdId =  BufferExtended.substr(buffer, offset,1) ;
                offset += 1;

                //webd token
                if (webdId[0] !== 1)
                    throw {message: "webd token is incorrect", token: webId};

                this.balances = [];
                let result = Serialization.deserializeBigNumber( buffer, offset );

                //console.log("result.number",result.number);

                this.updateBalanceToken(result.number);
                offset = result.newOffset;

                if (balancesLength > 0) {

                    //rest of tokens , in case there are
                    for (let i = 1; i < balancesLength; i++) {

                        let tokenId = BufferExtended.substr(buffer, offset, consts.MINI_BLOCKCHAIN.TOKEN_ID_LENGTH);
                        offset += consts.MINI_BLOCKCHAIN.TOKEN_ID_LENGTH;

                        result = Serialization.deserializeBigNumber(buffer, offset);

                        //console.log("result.number2",result.number);
                        this.updateBalanceToken(result.number, tokenId);

                        offset = result.newOffset;
                    }
                }

            }

            return offset;

        } catch (exception){
            console.error("error deserializing tree node", exception);
            throw exception;
        }

    }


    validateTreeNode(){

        let answer = InterfaceMerkleRadixTreeNode.prototype.validateTreeNode.apply(this, arguments);
        if (!answer) return false;

        if (!Number.isNumber(this.nonce)) throw {message: "nonce is invalid"};

        if (this.nonce < 0) throw {message: "nonce is less than 0"};
        if (this.nonce > 0xFFFF) throw {message: "nonce is higher than 0xFFFF"};

        return true;

    }


}

export default MiniBlockchainAccountantTreeNode