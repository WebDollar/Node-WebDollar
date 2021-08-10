import BufferExtended from 'common/utils/BufferExtended';

const Argon2 = require('./browser/Argon2-Browser').default

/**
 * Verify Argon2 Hash
 * @param data
 * @param initialHash
 * @returns {Promise.<boolean>}
 */
Argon2.verify = async (initialHash, data) => {

    let myHash;

    if (Buffer.isBuffer(initialHash)) {
        myHash = await Argon2.hash(data);

        //console.log("verify", myHash, initialHash)

        return BufferExtended.safeCompare(initialHash, myHash);
    }
    else
    if (typeof initialHash === 'string') {
        myHash = await Argon2.hashString(data);

        return myHash === initialHash;
    }

    return false;

}

export default Argon2