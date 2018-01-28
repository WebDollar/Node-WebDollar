import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkeRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";
import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import BufferExtended from "common/utils/BufferExtended";
import Serialization from "common/utils/Serialization";
import consts from 'consts/const_global'
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceMerkleRadixTreeNode from "common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree-Node"
import InterfaceRadixTreeEdge from "../../../trees/radix-tree/Interface-Radix-Tree-Edge";

let BigNumber = require('bignumber.js');

class MiniBlockchainAccountantTreeNode extends InterfaceMerkleRadixTreeNode{

    constructor (parent, edges, value){

        super(parent, edges);

        console.log("value", value);

        if (value !== undefined) {
            value = value || {};

            value.balances = value.balances||[];

            this.balances = value.balances;
            this.value = value;
        }

    }

    updateBalanceToken(value, tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = Buffer.from([1]);

        if (this.balances === undefined || this.balances === null) throw 'balances is null';

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

        if (result === undefined) throw 'token is empty';

        if (result.amount.lessThan(0) )
            throw 'balances became negative';

        this.deleteBalancesEmpty();

        if (this.balances.length === 0)
            return null; //to be deleted

        return {
            tokenId: result.id,
            amount: result.amount,
        };

    }

    getBalances(tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = new Buffer([1]);

        if (!Buffer.isBuffer(tokenId))
            tokenId = BufferExtended.fromBase(tokenId);

        for (let i=0; i<this.balances.length; i++)
            if (this.balances[i].id.equals( tokenId) )
                return this.balances[i].amount;

        return 0;

    }

    getBalances(){

        if (!this.isLeaf())
            return null;

        let list = { };

        for (let i=0; i<this.balances.length; i++)
            list[ "0x"+this.balances[i].id.toString("hex") ] = this.balances[i].amount.toString();


        return list;
    }

    deleteBalancesEmpty(){

        let result = false;
        for (let i=this.balances.length-1; i>=0; i--) {

            if (this.balances[i] === null || this.balances[i] === undefined || this.balances[i].amount.equals(0)) {
                this.balances.splice(i, 1);
                result = true;
            }
        }

        return true;

    }

    _serializeBalances(balances){

        return Buffer.concat(
            [
                balances.id,
                Serialization.serializeBigNumber(balances.amount)
            ]);

    }

    serializeNodeData( ){

        try {
            let buffer = [InterfaceMerkleRadixTreeNode.prototype.serializeNodeData.apply(this, arguments)],
                balancesBuffers = [];

            if (this.balances !== undefined && this.balances !== null) {
                //let serialize webd
                let iWEBDSerialized = null;
                for (let i = 0; i < this.balances.length; i++)
                    if ((this.balances[i].id.length === 1) && (this.balances[i].id[0] === 0)) {
                        balancesBuffers.push(this._serializeBalances(this.balances[i]));
                        iWEBDSerialized = i;
                    }

                // in case it was not serialize d and it is empty
                if (iWEBDSerialized === null) {
                    let idWEBD = new Buffer(1);
                    idWEBD[0] = 1;

                    balancesBuffers.push(this._serializeBalances({id: idWEBD, amount: new BigNumber(0)}));
                }

                //let serialize everything else
                for (let i = 0; i < this.balances.length; i++)
                    if (i !== iWEBDSerialized) {
                        balancesBuffers.push(this._serializeBalances(this.balances[i]));
                    }
            }

            balancesBuffers.unshift(Serialization.serializeNumber1Byte(balancesBuffers.length));

            return Buffer.concat([buffer, balancesBuffers]);

        } catch (exception){
            console.log("Error Serializing MiniAccountantTree NodeData", exception);
            throw exception;
        }

    }

    deserializeNodeData(buffer, offset){

        offset = InterfaceMerkleRadixTreeNode.prototype.deserializeNodeData.apply(this, arguments);

        try {

            let length = BufferExtended.substr(buffer, offset, 1);
            offset += 1;

            // webd balance
            let webdId = BufferExtended.substr(buffer, offset,1);
            offset += 1;

            //webd token
            if (webdId[0] !== 1) throw "webd token is incorrect";

            let result = Serialization.deserializeBigNumber( buffer, offset );

            offset = result.newOffset;

            if (length > 0 || result.greaterThan(0)) {

                this.balances = [];

                this.updateBalanceToken(result.number);

                //rest of tokens , in case there are
                for (let i = 1; i < length; i++) {
                    let tokenId = BufferExtended.substr(buffer, offset, consts.TOKEN_ID_LENGTH);
                    offset += consts.TOKEN_ID_LENGTH;

                    result = Serialization.deserializeBigNumber(buffer, offset);

                    this.updateBalanceToken(result.number, tokenId);

                    offset = result.newOffset;
                }
            }

        } catch (exception){
            console.log(colors.red("error deserializing tree node"), exception);
            throw exception;
        }

        return offset;

    }



}

export default MiniBlockchainAccountantTreeNode