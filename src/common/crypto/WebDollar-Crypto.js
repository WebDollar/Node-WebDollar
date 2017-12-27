var BigInteger = require('big-integer');

let crypto = null;

import Argon2 from 'common/crypto/Argon2/Argon2'

if ( typeof window !== 'undefined') {

    //tutorial based on
    crypto = require('crypto-browserify')
}
else {

    //tutorial based on
    crypto = require('crypto')
}




class WebDollarCrypto {

    /**
     *
     * @param bytes
     * return string
     */
    static encodeBase64(buffer) {

        if (!Buffer.isBuffer(buffer))
            buffer = new Buffer(buffer)

        let result = buffer.toString('base64');

        let newStr = '';
        for (let i = 0; i < result.length; i++) {

            if (result[i] === 'O') newStr +=  '&'; else
            if (result[i] === '0') newStr +=  '*'; else
            if (result[i] === 'I') newStr +=  '%'; else
            if (result[i] === 'l') newStr +=  '@'; else
            if (result[i] === '+') newStr +=  '#'; else
            if (result[i] === '/') newStr +=  '$';
            else newStr += result[i];

        }

        return newStr;
    }

    /**
     *
     * @param str
     * @returns {Buffer}
     */
    static  decodeBase64(str) {

        if (typeof str !== "string") throw "input is not string for base decoding" + typeof str;

        let newStr = '';
        for (let i = 0; i < str.length; i++) {

            if (str[i] === '&') newStr +=  'O'; else
            if (str[i] === '*') newStr +=  '0'; else
            if (str[i] === '%') newStr +=  'I'; else
            if (str[i] === '@') newStr +=  'l'; else
            if (str[i] === '#') newStr +=  '+'; else
            if (str[i] === '$') newStr +=  '/';
            else newStr += str[i];
        }

        let result = new Buffer(newStr, 'base64');

        return result;
    }

    static getBufferRandomValues(count){

        if ( count === undefined) count = 32;

        let randArr = new Buffer(count) //create a typed array of 32 bytes (256 bits)

        if ( typeof window !== 'undefined' &&  window.crypto !==undefined) window.crypto.getRandomValues(randArr) //populate array with cryptographically secure random numbers
        else {
            const getRandomValues = require('get-random-values');
            getRandomValues(randArr);
        }

        return randArr;
    }


    static bytesToHex(bytes){

        let result = '';
        for (let i=0; i<bytes.length; i++) {
            let hex = bytes[i].toString(16)
            result += (hex.length === 1 ? '0' : '') + hex ;
        }

        return result;
    }


    static isHex(h) {
        let a = parseInt(h,16);
        return (a.toString(16) ===h.toLowerCase())
    }

    static SHA256(bytes){

        let sha256 = crypto.createHash('sha256'); //sha256
        sha256.update(bytes)

        return sha256.digest();
    }
    
    static encryptAES(buffer, password){

        var cipher = crypto.createCipher('aes-256-cbc', password)
        var crypted = Buffer.concat([cipher.update(buffer),cipher.final()]);
        return crypted;
    }
    
    static decryptAES(buffer, password) {

        var decipher = crypto.createDecipher('aes-256-cbc', password)
        var dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
        return dec;
    }

    static RIPEMD160(bytes){

        let ripemd160 = crypto.createHash('ripemd160'); // RIPEMD160
        ripemd160.update(bytes)

        return ripemd160.digest()
    }

    /**
     * Hashing using Argon2
     * @param data
     * @param buffer
     * @returns {Promise.<Buffer>}
     */
    static hashPOW(data){

       return Argon2.hash(data)

    }

    /**
     * Hashing using Argon2
     * @param data
     * @returns {Promise.<String>}
     */
    static hashPOW_String(data){

        return Argon2.hashString(data)

    }

    /**
     * Verify the Hash using Argon2
     * @param hash
     * @param data
     */
    static verifyHashPOW(hash, data){

        return Argon2.verify(hash, data);

    }

}

export default WebDollarCrypto;