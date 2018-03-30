import BufferExtended from "common/utils/BufferExtended";
import Serialization from "common/utils/Serialization";
import consts from 'consts/const_global'
import InterfaceMerkleRadixTreeNode from "common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree-Node"
import Blockchain from "main-blockchain/Blockchain"

let BigNumber = require('bignumber.js');

class MiniBlockchainAccountantTreeNode extends InterfaceMerkleRadixTreeNode{

    constructor (root, parent, edges, value){

        super(root, parent, edges);

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
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            tokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
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
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            tokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
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

        // Converting balances into Hex Object fo
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

    _serializeBalance(balance){

        return Buffer.concat([
                Serialization.serializeToFixedBuffer(balance.id, consts.MINI_BLOCKCHAIN.TOKENS.OTHER_TOKEN_LENGTH),
                Serialization.serializeBigNumber(balance.amount)
            ]);
    }

    _serializeBalanceWEBDToken(balance){
        return Buffer.concat([
            Serialization.serializeToFixedBuffer(balance.id, consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH),
            Serialization.serializeBigNumber(balance.amount)
        ]);
    }

    serializeNodeData( includeEdges, includeHashes ){

        try {
            let hash, balancesBuffers = [];

            hash = InterfaceMerkleRadixTreeNode.prototype.serializeNodeDataHash.call(this, includeHashes);

            if (hash === null)
                hash = new Buffer(0);

            let buffer = Buffer.concat( [hash, Serialization.serializeNumber2Bytes(this.nonce)] );

            let balancesBuffered = new Buffer(0);

            if (this.balances !== undefined && this.balances !== null && this.balances.length > 0) {

                //let serialize WEBD Token
                let WEBDTokenIndex = null;
                for (let i = 0; i < this.balances.length; i++)
                    if ((this.balances[i].id.length === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH) && (this.balances[i].id[0] === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE)) {
                        WEBDTokenIndex = i;
                        break;
                    }

                // in case it was not serialize d and it is empty
                if (WEBDTokenIndex === null) {

                    if (this.balances.length > 0) {
                        let idWEBD = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
                        idWEBD[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;

                        balancesBuffers.push(this._serializeBalanceWEBDToken({id: idWEBD, amount: new BigNumber(0)}));
                    }

                } else {
                    balancesBuffers.push(this._serializeBalanceWEBDToken(this.balances[WEBDTokenIndex]));
                }

                //let serialize everything else
                for (let i = 0; i < this.balances.length; i++)
                    if (i !== WEBDTokenIndex)
                        balancesBuffers.push(this._serializeBalance(this.balances[i]));

                balancesBuffered = Buffer.concat(balancesBuffers);
            }


            return Buffer.concat( [ buffer, Serialization.serializeNumber1Byte(balancesBuffers.length), balancesBuffered ] );

        } catch (exception){
            console.log("Error Serializing MiniAccountantTree NodeData", exception);
            throw exception;
        }

    }

    deserializeNodeData(buffer, offset, includeEdges, includeHashes){

        offset = offset || 0;
        this.balances = []; // initialization

        // deserializing this.value
        offset = InterfaceMerkleRadixTreeNode.prototype.deserializeNodeDataHash.call(this, buffer, offset, includeHashes);

        this.nonce = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 2) ); //2 byte
        offset += 2;

        try {

            let balancesLength = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) ); //1 byte
            offset += 1;

            if (balancesLength > 0){

                // webd balance
                let webdId =  BufferExtended.substr(buffer, offset, consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH) ;
                offset += 1;

                //webd token
                if (webdId[0] !== consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE)
                    throw {message: "webd token is incorrect", token: webdId };

                let result = Serialization.deserializeBigNumber(buffer, offset);

                //console.log("result.number",result.number);

                this.updateBalanceToken(result.number, webdId);
                offset = result.newOffset;


                if (balancesLength > 1) {

                    //rest of tokens , in case there are
                    for (let i = 1; i < balancesLength; i++) {

                        let tokenId = BufferExtended.substr(buffer, offset, consts.MINI_BLOCKCHAIN.TOKENS.OTHER_TOKEN_LENGTH);
                        offset += consts.MINI_BLOCKCHAIN.TOKENS.OTHER_TOKEN_LENGTH;

                        result = Serialization.deserializeBigNumber(buffer, offset);

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


    validateTreeNode(validateMerkleTree){

        if (!InterfaceMerkleRadixTreeNode.prototype.validateTreeNode.apply(this, arguments)) return false;

        if (!Number.isInteger(this.nonce)) throw {message: "nonce is invalid"};

        if (this.nonce < 0) throw {message: "nonce is less than 0"};
        if (this.nonce > 0xFFFF) throw {message: "nonce is higher than 0xFFFF"};

        if (validateMerkleTree)
            return this._validateHash(this.root);

        return true;

    }


}

export default MiniBlockchainAccountantTreeNode