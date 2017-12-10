const bs58 = require('bs58')

import WebDollarCrypto from './WebDollar-Crypto';
import consts from 'consts/const_global'

Buffer.isBuffer()

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
            this.buffer = new Buffer(WebDollarCrypto.decodeBase64(data)); //if it is string, it must be a Base string
        else
        if (type === "utf-8")
            this.buffer = new Buffer(data, "utf-8");
        else
        if (type === "ascii" || typeof data === "string")
            this.buffer = new Buffer(data, "ascii");
        else
        if (type === "byte" || Array.isArray(data)) //if it is byte array
            this.buffer = new Buffer(data);
        else
        if (type === "object" || typeof data === "object"){

            if (data === null) this.buffer = new Buffer ( [0] );
            else {
                let newValue = null;
                let i = 0;

                //console.log("data object", data, typeof data);

                for (let property in data) {

                    if (data.hasOwnProperty(property)) {

                        //console.log("data[property]", typeof data[property], data[property]);
                        //console.log("WebDollarCryptoData.createWebDollarCryptoData(data[property], false)", WebDollarCryptoData.createWebDollarCryptoData(data[property], false));

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
                    this.buffer =  newValue.buffer;
                else this.buffer = new Buffer( [0] );
            }
        } else
        if (typeof data === "number") this.buffer = new Buffer( [data] );
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

    substr(index, count){

        if (typeof count === 'undefined') count = this.buffer.length;


        let array = [];
        for (let i=index; i<Math.min(index+count, this.buffer.length); i++)
            array.push(this.buffer[i]);

        return new WebDollarCryptoData( array, "byte");

    }

    longestMatch(cryptoData2, startIndex){

        if (! WebDollarCryptoData.isWebDollarCryptoData(cryptoData2)) return null;

        if (typeof startIndex === 'undefined') startIndex = 0;

        let i =0;
        while (i + startIndex < this.buffer.length && i < cryptoData2.buffer.length ) {

            if (this.buffer[i + startIndex] !== cryptoData2.buffer[i]) //no more match
                break;

            i++;
        }

        if (i !== 0){ //we have a match
            return this.substr(startIndex, i);
        }

        return  null;

    }

    concat(data){


        data = WebDollarCryptoData.createWebDollarCryptoData(data);

        this.buffer = Buffer.concat( [this.buffer, data.buffer] );

        return this;
    }

}

export default WebDollarCryptoData;