const CryptoJS = (require ('cryptojs')).Crypto;

class WebDollarCrypt {

    static encodeBase64(bytes) {

        let result = CryptoJS.util.bytesToBase64(bytes);

        let resultFinal = "";

        for (let i = 0; i < result.length; i++) {

            switch (result[i]){
                case 'O':
                    resultFinal +=  '#';
                    break;
                case '0':
                    resultFinal +=  '$';
                    break;
                case 'I':
                    resultFinal +=  '%';
                    break;
                case 'l':
                    resultFinal +=  '@';
                    break;
                case '+':
                    resultFinal +=  '&';
                    break;
                case '/':
                    resultFinal +=  '*';
                    break;
                default:
                    resultFinal += result[i];
                    break;
            }
        }

        return resultFinal;
    }



}

exports.WebDollarCrypt = WebDollarCrypt;