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

    static generatePublicKey(secretKey){

        if (secretKey === null || !Buffer.isBuffer(secretKey) ){
            console.error("ERROR! ",  secretKey, " is not a Buffer");
            throw 'privateKey must be a Buffer';
        }

        return nacl.box.keyPair.fromSecretKey(secretKey).publicKey;

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

        return nacl.sign.detached.verify(data, signature, publicKey)

    }

}

export default ED25519;