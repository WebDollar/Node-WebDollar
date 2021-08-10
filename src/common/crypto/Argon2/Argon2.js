import BufferExtended from 'common/utils/BufferExtended';
import consts from "../../../consts/const_global";

const argon2 = require("argon2-browser");

export default {

    async hash (data) {

        let result = await argon2.hash({
            salt: consts.HASH_ARGON2_PARAMS.salt,
            time: consts.HASH_ARGON2_PARAMS.time,
            mem: consts.HASH_ARGON2_PARAMS.memBytes,
            parallelism: consts.HASH_ARGON2_PARAMS.parallelism,
            type: consts.HASH_ARGON2_PARAMS.algoBrowser,
            hashLen: consts.HASH_ARGON2_PARAMS.hashLen,
            pass: data,
        });

        if (Buffer.isBuffer(data) )
            return Buffer.from(result.hash);
        else if (typeof data === "string" )
            result.hash

    },

    async verify (initialHash, data) {

        const myHash = await this.hash(data);
        //console.log("verify", myHash, initialHash)

        if (Buffer.isBuffer(initialHash))
            return BufferExtended.safeCompare(initialHash, myHash);
        if (typeof initialHash === 'string')
            return myHash === initialHash

        return false
    }



}
