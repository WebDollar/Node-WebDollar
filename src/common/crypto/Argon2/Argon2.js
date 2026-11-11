import BufferExtended from 'common/utils/BufferExtended';
import consts from "../../../consts/const_global";

const argon2 = require("argon2-browser");

// Node 18+ are `fetch` global nativ. Glue code-ul emscripten din
// argon2-browser/dist/argon2.js decide dacă încarcă WASM prin `fetch()`
// sau prin citire de fișier verificând doar `typeof fetch === "function"`,
// fără să verifice dacă rulează în Node (vezi issue upstream #83, neînchis).
// Pe Node 16 `fetch` nu exista global, așa că alegea corect calea de citire
// din fișier; pe Node 24 alege greșit `fetch('argon2.wasm')`, care eșuează.
// Modulul WASM se încarcă o singură dată (cache-uit intern de argon2-browser),
// deci ascundem `fetch` doar pentru prima apelare care îl declanșează.
let argon2ModuleLoaded = false;
async function ensureArgon2ModuleLoadedWithoutFetch(){

    if (argon2ModuleLoaded) return;

    const hadFetch = typeof global.fetch === 'function';
    const originalFetch = global.fetch;
    if (hadFetch) delete global.fetch;

    try {
        await argon2.hash({
            salt: consts.HASH_ARGON2_PARAMS.salt,
            time: 1,
            mem: 1024,
            parallelism: 1,
            type: consts.HASH_ARGON2_PARAMS.algoBrowser,
            hashLen: consts.HASH_ARGON2_PARAMS.hashLen,
            pass: 'warmup',
        });
    } finally {
        if (hadFetch) global.fetch = originalFetch;
    }

    argon2ModuleLoaded = true;
}

export default {

    async hash (data) {

        await ensureArgon2ModuleLoadedWithoutFetch();

        let result = await argon2.hash({
            salt: consts.HASH_ARGON2_PARAMS.salt,
            time: consts.HASH_ARGON2_PARAMS.time,
            mem: consts.HASH_ARGON2_PARAMS.memBytes,
            parallelism: consts.HASH_ARGON2_PARAMS.parallelism,
            type: consts.HASH_ARGON2_PARAMS.algoBrowser,
            hashLen: consts.HASH_ARGON2_PARAMS.hashLen,
            pass: data,
        });

        if (!Buffer.isBuffer(result.hash)) return Buffer.from(result.hash)
        return result.hash;

    },

    async hashString(data){
        const hash = await this.hash(data)
        return hash.toString('hex')
    },

    async verify (initialHash, data) {

        const myHash = await this.hash(data);
        //console.log("verify", myHash, initialHash)

        if (Buffer.isBuffer(initialHash))  return BufferExtended.safeCompare(initialHash, myHash);
        if (typeof initialHash === 'string') return myHash.toString("hex") === initialHash

        return false
    }



}
