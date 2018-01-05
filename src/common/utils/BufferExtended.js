import consts from "consts/const_global"
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
const bs58 = require('bs58')

class BufferExtended {

    substr(buffer, index, count){
        if ( count === undefined) count = buffer.length;

        let length = Math.min(index+count, buffer.length);

        let array = new Buffer(length-index);

        for (let i=index; i<length; i++)
            array[i-index] = buffer[i];

        return array;
    }

    longestMatch(buffer, buffer2, startIndex){

        if ( startIndex === undefined) startIndex = 0;

        let i =0;
        while (i + startIndex < buffer.length && i < buffer2.length ) {

            if (buffer[i + startIndex] !== buffer2[i]) //no more match
                break;

            i++;
        }

        if (i !== 0){ //we have a match
            return this.substr(buffer, startIndex, i);
        }

        return  null;

    }

    toBase(buffer){
        if (consts.PRIVATE_KEY_USE_BASE64)  {
            return WebDollarCrypto.encodeBase64(buffer);
        }
        else {
            return bs58.encode(buffer);
        }
    }

    fromBase(string){
        if (consts.PRIVATE_KEY_USE_BASE64)  {
            return WebDollarCrypto.decodeBase64(string); //if it is string, it must be a Base string
        }
        else {

            return bs58.decode(string);
        }
    }

}

export default new BufferExtended();