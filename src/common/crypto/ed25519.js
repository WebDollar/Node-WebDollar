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

    static generatePrivateKey(fromSecret){

        let privateKey;
        if (!fromSecret ) privateKey = nacl.sign.keyPair().secretKey;
        else privateKey = nacl.sign.keyPair.fromSecretKey(fromSecret).secretKey;

        if ( ! Buffer.isBuffer(privateKey) )
            privateKey = new Buffer(privateKey);

        return privateKey;
    }

    static generatePublicKey(secretKey){

        if (!secretKey || !Buffer.isBuffer(secretKey) ) throw { message: 'privateKey must be a Buffer', secretKey: secretKey};

        let publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;

        if (!Buffer.isBuffer(publicKey))
            publicKey = new Buffer(publicKey);

        return publicKey;

    }

    static sign(data, secretKey){

        if (!secretKey || !Buffer.isBuffer(secretKey) ) throw {message: 'secretKey must be a Buffer', secretKey: secretKey};
        if (!data || !Buffer.isBuffer(data) ) throw {message: 'data must be a Buffer', data: data};

        let signature = nacl.sign.detached( data, secretKey );

        if ( !Buffer.isBuffer(signature) )
            signature = new Buffer(signature);


        return signature;
    }

    static verify(signature, data, publicKey){

        if (!signature || !Buffer.isBuffer(signature) ) throw {message: 'signature must be a Buffer', signature: signature};
        if (!data || !Buffer.isBuffer(data) ) throw {message: 'data must be a Buffer', data:data};
        if (!publicKey || !Buffer.isBuffer(publicKey) ) throw {message: 'publicKey must be a Buffer', publicKey: publicKey};

        return nacl.sign.detached.verify(data, signature, publicKey)

    }

}

export default ED25519;