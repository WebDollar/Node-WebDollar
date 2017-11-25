const CryptoJS = (require ('cryptojs')).Crypto;

let Argon2 = null;
if (typeof window !== 'undefined') {

    //tutorial based on https://github.com/ranisalt/node-argon2
    Argon2 = require('argon2-browser');
}
else {

    //tutorial based on https://www.npmjs.com/package/argon2
    Argon2 = require('argon2')
}

const HASH_ARGON2_OPTIONS = { timeCost: 4, memoryCost: 13, parallelism: 2, type: Argon2.argon2d }


class WebDollarCrypt {

    static encodeBase64(bytes) {

        let result = CryptoJS.util.bytesToBase64(bytes);

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


    static isHex(h) {
        let a = parseInt(h,16);
        return (a.toString(16) ===h.toLowerCase())
    }

    /**
     * Hashing using Argon2
     * @param data
     * @param buffer
     * @returns {Promise.<Buffer>}
     */
    static async hashPOW(data, buffer){

        try{

            let hash = await Argon2.hash(data, {
                raw: (typeof buffer === 'undefined' ? true : buffer),
                options : HASH_ARGON2_OPTIONS,
            })

            return hash;

        } catch (Exception){
            throw 'Argon2 is not supported. ' + Exception.toString()
        }

    }

    /**
     * Hashing using Argon2
     * @param data
     * @returns {Promise.<String>}
     */
    static async hashPOWString(data){

        return WebDollarCrypt.hash(data, false)

    }

    static async verifyHashPOW(hash, data){

        try{
            
            Argon2.verify(hash, data).then(match => {
          if (match) {
            // password match
          } else {
            // password did not match
          }
        }).catch(err => {
          // internal failure
        });

        } catch (Exception){

        }

    }

}

export default WebDollarCrypt;