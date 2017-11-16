const Crypto = (require ('cryptojs')).Crypto

class InterfaceBlockchainAddress{


    constructor (){

    }

    static createAddress(input, showDebug){

        // tutorial based on http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript

        let randArr = new Uint8Array(32) //create a typed array of 32 bytes (256 bits)

        if (typeof window !== 'undefined' && typeof window.crypto !=='undefined') window.crypto.getRandomValues(randArr) //populate array with cryptographically secure random numbers
        else {
            const getRandomValues = require('get-random-values');
            getRandomValues(randArr);
        }

        //some Bitcoin and Crypto methods don't like Uint8Array for input. They expect regular JS arrays.
        let privateKeyBytes = []
        for (let i = 0; i < randArr.length; ++i)
            privateKeyBytes[i] = randArr[i]

        //if you want to follow the step-by-step results in this article, comment the
        //previous code and uncomment the following
        //var privateKeyBytes = Crypto.util.hexToBytes("1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD")

        //hex string of our private key
        let privateKeyHex = Crypto.util.bytesToHex(privateKeyBytes).toUpperCase()

        if (showDebug)
            console.log(privateKeyHex) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD

    }

    static validateAddress(address){

    }



}

exports.InterfaceBlockchainAddress = InterfaceBlockchainAddress;