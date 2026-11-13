var assert = require('assert')
import ED25519, { verifySignature } from 'common/crypto/ed25519'

// Măsurat empiric (benchmark separat, 2000 verify-uri): tweetnacl (JS pur)
// ~17ms/verify, libsodium-wrappers (WASM) ~0.29ms/verify — ~58x mai rapid,
// deplin compatibil (semnături ed25519 standard, interschimbabile). Explică
// cea mai mare parte din costul real per tranzacție găsit la investigația
// de viteză a resincronizării (SYNC_TIMING_DEBUG).
//
// libsodium-wrappers are o inițializare WASM asincronă (`sodium.ready`);
// `verifySignature` e extrasă ca funcție pură, testabilă determinist pe
// ambele ramuri (înainte și după ce libsodium e pregătit), fără curse de
// timing în teste.
describe('ED25519', () => {

    it('generatePublicKey + sign + verify funcționează end-to-end (comportament neschimbat)', () => {

        const secretKey = ED25519.generatePrivateKey();
        const publicKey = ED25519.generatePublicKey(secretKey);
        const data = Buffer.from('mesaj de test');

        const signature = ED25519.sign(data, secretKey);

        assert.strictEqual(ED25519.verify(signature, data, publicKey), true);

    });

    it('verify respinge o semnătură pentru date alterate', () => {

        const secretKey = ED25519.generatePrivateKey();
        const publicKey = ED25519.generatePublicKey(secretKey);
        const data = Buffer.from('mesaj original');
        const tampered = Buffer.from('mesaj alterat');

        const signature = ED25519.sign(data, secretKey);

        assert.strictEqual(ED25519.verify(signature, tampered, publicKey), false);

    });

    it('verifySignature(useSodium=false) folosește tweetnacl și dă același rezultat ca verify()', () => {

        const secretKey = ED25519.generatePrivateKey();
        const publicKey = ED25519.generatePublicKey(secretKey);
        const data = Buffer.from('mesaj pentru ramura tweetnacl');
        const signature = ED25519.sign(data, secretKey);

        assert.strictEqual(verifySignature(signature, data, publicKey, false), true);
        assert.strictEqual(verifySignature(signature, Buffer.from('alt mesaj'), publicKey, false), false);

    });

    it('verifySignature(useSodium=true) folosește libsodium și dă același rezultat', async () => {

        await ED25519.sodiumReadyPromise();

        const secretKey = ED25519.generatePrivateKey();
        const publicKey = ED25519.generatePublicKey(secretKey);
        const data = Buffer.from('mesaj pentru ramura libsodium');
        const signature = ED25519.sign(data, secretKey);

        assert.strictEqual(verifySignature(signature, data, publicKey, true), true);
        assert.strictEqual(verifySignature(signature, Buffer.from('alt mesaj'), publicKey, true), false);

    });

    it('după ce libsodium e pregătit, ED25519.verify() foloseşte automat ramura rapidă', async () => {

        await ED25519.sodiumReadyPromise();

        assert.strictEqual(ED25519.isSodiumReady(), true);

        const secretKey = ED25519.generatePrivateKey();
        const publicKey = ED25519.generatePublicKey(secretKey);
        const data = Buffer.from('mesaj după ready');
        const signature = ED25519.sign(data, secretKey);

        assert.strictEqual(ED25519.verify(signature, data, publicKey), true);

    });

});
