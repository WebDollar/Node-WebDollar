/**
 *
 * SCHNOR SIGNATURES
 *
 *
 * TUTORIAL based on https://github.com/exonum/exonum-client/blob/master/src/crypto/index.js
 *
 *
 **/

import nacl from 'tweetnacl'

class ED25519{

    static generatePrivateKey(){

        let privateKey = nacl.sign.keyPair().secretKey;

        if ( ! Buffer.isBuffer(privateKey) )
            privateKey = new Buffer(privateKey);

        return privateKey;
    }

    static generatePublicKey(secretKey){

        if (secretKey === null || !Buffer.isBuffer(secretKey) ){
            console.error("ERROR! ",  secretKey, " is not a Buffer");
            throw 'privateKey must be a Buffer';
        }

        console.warn("SCHNORR generate secretKey", secretKey.toString("hex") )
        console.warn("SCHNORR generate publicKey", nacl.sign.keyPair.fromSecretKey(secretKey).publicKey.toString("hex") )

        let publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;

        if (!Buffer.isBuffer(publicKey))
            publicKey = new Buffer(publicKey);

        return publicKey;

    }

    static sign(data, secretKey){

        if (secretKey === null || !Buffer.isBuffer(secretKey) ){
            console.error("ERROR! secretKey ",  secretKey, " is not a Buffer");
            throw 'secretKey must be a Buffer';
        }

        if (data === null || !Buffer.isBuffer(data) ){
            console.error("ERROR! data ",  secretKey, " is not a Buffer");
            throw 'data must be a Buffer';
        }

        let signature = nacl.sign.detached( data, secretKey );

        if ( !Buffer.isBuffer(signature) )
            signature = new Buffer(signature);

        console.warn("SCHNORR data", data.toString("hex") )
        console.warn("SCHNORR signature", signature.toString("hex") )

        return signature;
    }

    static verify(signature, data, publicKey){

        if (signature === null || !Buffer.isBuffer(signature) ){
            console.error("ERROR! signature ",  signature, " is not a Buffer");
            throw 'signature must be a Buffer';
        }

        if (data === null || !Buffer.isBuffer(data) ){
            console.error("ERROR! data ",  secretKey, " is not a Buffer");
            throw 'data must be a Buffer';
        }

        if (publicKey === null || !Buffer.isBuffer(publicKey) ){
            console.error("ERROR! data ",  publicKey, " is not a Buffer");
            throw 'publicKey must be a Buffer';
        }

        console.warn("SCHNORR data", data.toString("hex") )
        console.warn("SCHNORR signature", signature.toString("hex") )
        console.warn("SCHNORR publicKey", publicKey.toString("hex") )

        return nacl.sign.detached.verify(data, signature, publicKey)

    }

}

export default ED25519;