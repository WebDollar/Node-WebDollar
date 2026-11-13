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
import sodium from 'libsodium-wrappers'

// libsodium-wrappers e WASM, cu inițializare asincronă (`sodium.ready`).
// Verificarea de semnătură e pe calea critică a validării fiecărei
// tranzacții la resincronizare (măsurat: tweetnacl ~17ms/verify,
// libsodium ~0.29ms/verify, ~58x — vezi investigația de viteză).
// Până se încarcă WASM-ul (tipic câteva ms-zeci de ms la pornirea
// procesului), verify() rămâne corect folosind tweetnacl ca fallback —
// nu se schimbă contractul sincron al funcției nicăieri în restul
// codului.
let sodiumReady = false;
const sodiumReadyPromise = sodium.ready.then(() => { sodiumReady = true; });

/** Funcție pură, testabilă determinist pe ambele ramuri (fără cursă de timing). */
export function verifySignature(signature, data, publicKey, useSodium){
    return useSodium
        ? sodium.crypto_sign_verify_detached(signature, data, publicKey)
        : nacl.sign.detached.verify(data, signature, publicKey);
}

class ED25519{

    static generatePrivateKey(fromSecret){

        let privateKey;
        if (!fromSecret ) privateKey = nacl.sign.keyPair().secretKey;
        else privateKey = nacl.sign.keyPair.fromSecretKey(fromSecret).secretKey;

        if ( ! Buffer.isBuffer(privateKey) )
            privateKey = Buffer.from(privateKey);

        return privateKey;
    }

    static generatePublicKey(secretKey){

        if (!secretKey || !Buffer.isBuffer(secretKey) ) throw { message: 'privateKey must be a Buffer', secretKey: secretKey};

        let publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;

        if (!Buffer.isBuffer(publicKey))
            publicKey = Buffer.from(publicKey);

        return publicKey;

    }

    static sign(data, secretKey){

        if (!secretKey || !Buffer.isBuffer(secretKey) ) throw {message: 'secretKey must be a Buffer', secretKey: secretKey};
        if (!data || !Buffer.isBuffer(data) ) throw {message: 'data must be a Buffer', data: data};

        let signature = nacl.sign.detached( data, secretKey );

        if ( !Buffer.isBuffer(signature) )
            signature = Buffer.from(signature);


        return signature;
    }

    static verify(signature, data, publicKey){

        if (!signature || !Buffer.isBuffer(signature) ) throw {message: 'signature must be a Buffer', signature: signature};
        if (!data || !Buffer.isBuffer(data) ) throw {message: 'data must be a Buffer', data:data};
        if (!publicKey || !Buffer.isBuffer(publicKey) ) throw {message: 'publicKey must be a Buffer', publicKey: publicKey};

        return verifySignature(signature, data, publicKey, sodiumReady);

    }

    static isSodiumReady(){
        return sodiumReady;
    }

    static sodiumReadyPromise(){
        return sodiumReadyPromise;
    }

}

export default ED25519;
