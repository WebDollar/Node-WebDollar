const CryptoJS = (require ('cryptojs')).Crypto;

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

}

exports.WebDollarCrypt = WebDollarCrypt;