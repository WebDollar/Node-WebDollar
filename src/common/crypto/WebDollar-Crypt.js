let crypto = null;

if (typeof window !== 'undefined') {

    //tutorial based on
    crypto = require('crypto-browserify')
}
else {

    //tutorial based on
    crypto = require('crypto')
}




class WebDollarCrypt {

    static encodeBase64(bytes) {

        let result = new Buffer(bytes).toString('base64');

        let resultFinal = "";

        for (let i = 0; i < result.length; i++) {

            switch (result[i]){
                case 'O':
                    resultFinal +=  '&';
                    break;
                case '0':
                    resultFinal +=  '*';
                    break;
                case 'I':
                    resultFinal +=  '%';
                    break;
                case 'l':
                    resultFinal +=  '@';
                    break;
                case '+':
                    resultFinal +=  '#';
                    break;
                case '/':
                    resultFinal +=  '$';
                    break;
                default:
                    resultFinal += result[i];
                    break;
            }
        }

        return resultFinal;
    }


    static getByteRandomValues(count){

        if (typeof count === 'undefined') count = 32;

        let randArr = new Uint8Array(count) //create a typed array of 32 bytes (256 bits)

        if (typeof window !== 'undefined' && typeof window.crypto !=='undefined') window.crypto.getRandomValues(randArr) //populate array with cryptographically secure random numbers
        else {
            const getRandomValues = require('get-random-values');
            getRandomValues(randArr);
        }

        //some Bitcoin and Crypto methods don't like Uint8Array for input. They expect regular JS arrays.
        let dataBytes = []
        for (let i = 0; i < randArr.length; ++i)
            dataBytes[i] = randArr[i]

        return dataBytes;
    }

    static bytesToHex(bytes){

        let result = '';
        for (let i=0; i<bytes.length; i++)
            result += bytes[i].toString(16)

        return result;
    }


    static isHex(h) {
        let a = parseInt(h,16);
        return (a.toString(16) ===h.toLowerCase())
    }

    static SHA256(bytes){
        let sha256 = crypto.createHash('sha256'); //sha256
        sha256.update(bytes)
        return sha256.digest()
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

export default WebDollarCrypt;