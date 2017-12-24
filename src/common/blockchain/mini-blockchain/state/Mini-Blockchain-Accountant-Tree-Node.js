import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkeRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";
import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";
import Serialization from "common/utils/Serialization";
import consts from 'consts/const_global'

let BigDecimal = require('decimal.js');

class MiniBlockchainAccountantTreeNode extends InterfaceRadixTreeNode{

    constructor (parent, edges, value){

        super(parent, edges);

        if (value !== undefined) {
            value = value || {};

            value.balances = value.balances||[];

            this.balances = value.balances;
            this.value = value;
        }


    }

    updateBalanceToken(value, tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = 1;

        if (this.balances === undefined || this.balances === null) throw 'balances is null';

        tokenId = WebDollarCryptoData.createWebDollarCryptoData(tokenId).buffer;

        if (!value instanceof BigDecimal)
            value = new BigDecimal(value);

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

        if (result.amount < 0)
            throw 'balance became negative';

        this.deleteBalancesEmpty();

        if (this.balances.length === 0)
            return null; //to be deleted

        return {
            tokenId: result.id,
            amount: result.amount,
        };

    }

    getBalance(tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = 1;

        tokenId = WebDollarCryptoData.createWebDollarCryptoData(tokenId).buffer;

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
            list[ this.balances[i].id.toString() ] = this.balances[i].amount;


        return list;
    }

    deleteBalancesEmpty(){

        let result = false;
        for (let i=this.balances.length-1; i>=0; i--)
            if (this.balances[i].amount.equals(0) || this.balances[i] === null) {
                this.balances.splice(i, 1);
                result = true;
            }

        return true;

    }

    _serializeBalance(balance){

        return Buffer.concat(
            [
                balance.id,
                Serialization.serializeBigDecimal(balance.amount)
            ]);

    }

    serialize(){

        let buffer, balancesBuffers = [];

        //let serialize webd
        let iWEBDSerialized = null;
        for (let i=0; i<this.balances.length; i++)
            if ((this.balances[i].id.length === 1) && (this.balances[i].id[0]===0)){
                balancesBuffers.push(this._serializeBalance(this.balances[i]));
                iWEBDSerialized = i;
            }

        // in case it was not serialize d and it is empty
        if ( iWEBDSerialized  === null){
            let idWEBD = new Buffer(1);
            idWEBD[0] = 1;

            balancesBuffers.push( this._serializeBalance({id:idWEBD, amount: new BigDecimal(0) }));
        }

        //let serialize everything else
        for (let i=0; i<this.balances.length; i++)
            if (i !== iWEBDSerialized){
                balancesBuffers.push(this._serializeBalance(this.balances[i]));
            }

        balancesBuffers.unshift(Serialization.serializeNumber1Byte(balancesBuffers.length))

        buffer = Buffer.concat ( balancesBuffers );

        return buffer;

    }

    deserialize(buffer){

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer);

        let offset = 0;

        try {
            if (height >= 0) {

                let length = data.substr(offset, 1).buffer;
                offset += 1;

                // webd balance
                let webdId = data.substr(offset,1).buffer;
                offset += 1;

                if (webdId[0] !== 1) throw "webd token is incorrect";
                let result = Serialization.deserializeBigDecimal( data, offset );

                this.updateBalanceToken(result.number);

                offset = result.newOffset;

                //rest of tokens , in case there are
                for (let i=1; i<length; i++){
                    let tokenId = data.substr(offset,consts.TOKEN_ID_LENGTH).buffer;
                    offset += consts.TOKEN_ID_LENGTH;

                    result = Serialization.deserializeBigDecimal(data, offset);

                    this.updateBalanceToken(result.number, tokenId)

                    offset = result.newOffset;
                }

            }
        } catch (exception){
            console.log(colors.red("error deserializing tree node"), exception);
            throw exception;
        }


    }

}

export default MiniBlockchainAccountantTreeNode