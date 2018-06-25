const BigInteger = require('big-integer');

class Utils{

     validateUrl(value) {
         return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
     }

    getLocation(href) {

        //answer based on https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
        let match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
        return match && {
            href: href,
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7]
        }
    }

    /**
     * Divides 2 big integers
     * @param divident is BigInteger
     * @param divisor is BigInteger
     * @returns {number}
     */
    divideBigIntegers(divident, divisor) {

        let result = 1;
        let X = new BigInteger(divisor);

        //TODO: binary search for result
        while(X.compare(divident) <= 0) {
            X = X.plus(divisor);
            result++;
        }

        return result - 1;
    }


    MakeQuerablePromise(promise) {
        // Don't modify any promise that has been already modified.
        if (promise.isQuerable) return promise;

        // Set initial state
        let isPending = true;
        let isRejected = false;
        let isFulfilled = false;

        // Observe the promise, saving the fulfillment in a closure scope.
        let result = promise.then(
            function(v) {
                isFulfilled = true;
                isPending = false;
                return v;
            },
            function(e) {
                isRejected = true;
                isPending = false;
                throw e;
            }
        );

        result.isFulfilled = function() { return isFulfilled; };
        result.isPending = function() { return isPending; };
        result.isRejected = function() { return isRejected; };

        result.isQuerable = true;

        return result;
    }


}

export default new Utils();