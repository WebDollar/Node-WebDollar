const BigInteger = require('big-integer');

import BufferExtended from "../utils/BufferExtended";
import WebDollarCrypto from './WebDollar-Crypto';
import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global'

class WebDollarCryptoData {

    static isWebDollarCryptoData(object){

        if (typeof object !== 'object' || object === null )
            return false;

        if (object instanceof WebDollarCryptoData)
            return true;

        return false;
    }

    static createWebDollarCryptoData(object, forceToCreate){

        //console.log("createWebDollarCryptoData",object);

        //if it s WebDollarCryptoData, then return it
        if (WebDollarCryptoData.isWebDollarCryptoData(object)){

            if (forceToCreate)
                return new WebDollarCryptoData( new Buffer(object.buffer), "buffer" );

            return object;
        }

        let cryptoData = new WebDollarCryptoData(object);

        if (forceToCreate && cryptoData.buffer !== null) {
            cryptoData.buffer = new Buffer(cryptoData.buffer);
        }

        return cryptoData;
    }

    constructor (data, type){

        this.buffer = null;

        if ((data !== null && Buffer.isBuffer(data)) || (type==="buffer"))
            this.buffer = data;
        else
        if (type === "hex")
            this.buffer = new Buffer(data, "hex");
        else
        if (type === "base")
            this.buffer = new Buffer(BufferExtended.fromBase(data)); //if it is string, it must be a Base string
        else
        if (type === "utf-8")
            this.buffer = new Buffer(data, "utf-8");
        else
        if (type === "ascii" || typeof data === "string")
            this.buffer = new Buffer(data, "ascii");
        else
        if (type === "byte" || Array.isArray(data)) //if it is array
        {
            if (data.length > 0 && typeof data[0] === "object" )
                this.buffer = this.createBufferFromArray(data);
            else // byte array
                this.buffer = new Buffer(data);
        }
        else
        if (type === "object" || typeof data === "object"){

            if (data instanceof BigInteger) {

                //converting number value into a buffer
                this.buffer = Serialization.serializeBigInteger(data);
                return;
            }

            if (typeof data === 'number'){
                this.buffer = Serialization.serializeNumber8Bytes(data);
                return;
            }

            if (data === null)
                this.buffer = new Buffer ( [0] );
            else
                this.buffer = this.createBufferFromArray(data);

        }
        else
        if (typeof data === "number"){

            //converting number value into a buffer on 4 bytes
            this.buffer = Serialization.serializeNumber4Bytes(data)
        }

    }

    createBufferFromArray(data){

        let newValue = null;
        let i = 0;

        //console.log("Data", data);

        for (let property in data) {

            if (data.hasOwnProperty(property)) {

                if (i === 0)
                    newValue = WebDollarCryptoData.createWebDollarCryptoData( data[property], true);
                else {
                    if (Buffer.isBuffer(data[property]))
                        newValue.concat( data[property], false );
                    else
                        newValue.concat(WebDollarCryptoData.createWebDollarCryptoData(data[property], false));
                }

                //console.log("newValue", newValue);

                i++;
            }
        }

        if (newValue !== null)
            return newValue.buffer;
        else
            return new Buffer( [0] );
    }

    toHex(){
        return this.buffer.toString('hex');
    }

    toString(param){
        
        return this.buffer.toString(param);
    }

    toBytes(){

        let result = [];
        
        for (let i = 0; i < this.buffer.length; ++i) {
            result.push (this.buffer[i]);
        }
        
        return result;
    }

    toUint8Array(){
        
        let result = new Uint8Array(this.buffer.length);
        
        for (let i = 0; i < this.buffer.length; ++i) {
            result[i] = this.buffer[i];
        }
        
        return result;
    }

    toBase(){
        
        return BufferExtended.toBase(this.buffer);
    }

    substr(index, count){
        return BufferExtended.substr(this.buffer, index, count);
    }

    longestMatch(cryptoData2, startIndex){

        if (! WebDollarCryptoData.isWebDollarCryptoData(cryptoData2))
            return null;

        return BufferExtended.longestMatch(this.buffer, cryptoData2.buffer, startIndex );
    }

    concat(data){

        data = WebDollarCryptoData.createWebDollarCryptoData(data);

        this.buffer = Buffer.concat( [this.buffer, data.buffer] );

        return this;
    }



    compare(data){

        if (!Buffer.isBuffer(data))
            data = WebDollarCryptoData.createWebDollarCryptoData(data);

        return this.buffer.compare(data.buffer)
    }

    toInt(){
        
        return Serialization.deserializeNumber(this.buffer);
    }

}

export default WebDollarCryptoData;