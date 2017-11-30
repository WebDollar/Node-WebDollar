const bs58 = require('bs58')

import WebDollarCrypt from './WebDollar-Crypt';
import consts from 'consts/const_global'

Buffer.isBuffer()

class WebDollarCryptData {

    static isWebDollarCryptData(object){

        if (typeof object !== 'object' || object === null || object.constructor.name !== 'WebDollarCryptData')
            return false;

        return true;

    }

    static createWebDollarCryptData(object){

        //if it s WebDollarCryptData, then return it
        if (WebDollarCryptData.isWebDollarCryptData(object)) return object;

        //if it is a Buffer
        if (Buffer.isBuffer(object)) return new WebDollarCryptData(object, "buffer");

        //if it is byte array
        if (Array.isArray(object)) return new WebDollarCryptData(object, "base");

        //if it is string, it must be a Base string
        if (typeof object === "string") return new WebDollarCryptData(object, "base");

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
            console.log("NOT IMPLENTED YET");
        }

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
        if (!consts.PRIVATE_KEY_USE_BASE64)  {
            return bs58.encode(this.toBytes());
        }
        else {

            return WebDollarCrypt.encodeBase64(this.toUint8Array());
        }
    }

    substr(index, count){

        if (typeof count === 'undefined') count = this.buffer.length;


        let array = [];
        for (let i=index; i<Math.min(index+count, this.buffer.length); i++)
            array.push(this.buffer[i]);

        return new WebDollarCryptData( array, "byte");

    }

}

export default WebDollarCryptData;