const bs58 = require('bs58')

import WebDollarCrypto from './WebDollar-Crypto';
import consts from 'consts/const_global'

Buffer.isBuffer()

class WebDollarCryptoData {

    static isWebDollarCryptoData(object){

        if (typeof object !== 'object' || object === null || ! object instanceof WebDollarCryptoData )
            return false;

        return true;

    }

    static createWebDollarCryptoData(object){

        //if it s WebDollarCryptoData, then return it
        if (WebDollarCryptoData.isWebDollarCryptoData(object)) return object;

        //if it is a Buffer
        if (Buffer.isBuffer(object)) return new WebDollarCryptoData(object, "buffer");

        //if it is byte array
        if (Array.isArray(object)) return new WebDollarCryptoData(object, "byte");

        //if it is string, it must be a Base string
        if (typeof object === "string") return new WebDollarCryptoData(object, "base");

    }

    constructor (data, type){

        this.buffer = null;

        if ((data !== 'null' && Buffer.isBuffer(data)) || (type==="buffer"))
            this.buffer = data;
        else
        if (type === "hex")
            this.buffer = new Buffer(data, "hex");
        else
        if (type === "byte")
            this.buffer = new Buffer(data);
        else
        if (type === "base"){
            throw("NOT IMPLENTED YET");
        } else
        if (type === "ascii")
            this.buffer = new Buffer(data, "ascii");
        if (type === "utf-8")
            this.buffer = new Buffer(data, "utf-8");

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
        if (consts.PRIVATE_KEY_USE_BASE64)  {
            return WebDollarCrypto.encodeBase64(this.toUint8Array());
        }
        else {
            return bs58.encode(this.toBytes());
        }
    }

    decodeBase64(){
        if (consts.PRIVATE_KEY_USE_BASE64)  {
            return WebDollarCrypto.decodeBase64(this.toUint8Array());
        }
        else {
            return bs58.decode(this.toBytes());
        }
    }

    substr(index, count){

        if (typeof count === 'undefined') count = this.buffer.length;


        let array = [];
        for (let i=index; i<Math.min(index+count, this.buffer.length); i++)
            array.push(this.buffer[i]);

        return new WebDollarCryptoData( array, "byte");

    }

    longestMatch(buffer2, startIndex){

        if (typeof startIndex === 'undefined') startIndex = 0;

        let i =0;
        while (i + startIndex < this.buffer.length && i < buffer2.length ) {

            if (this.buffer[i + startIndex] !== buffer2[i]) //no more match
                break;

            i++;
        }

        if (i !== 0){ //we have a match
            return this.substr(startIndex, i);
        }

        return  null;

    }

}

export default WebDollarCryptoData;