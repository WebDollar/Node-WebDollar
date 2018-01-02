let Argon2 = null;

if ( typeof window !== 'undefined') {

    //tutorial based on https://github.com/ranisalt/node-argon2
    Argon2 = require('./browser/Argon2-Browser').default
}
else {

    //tutorial based on https://www.npmjs.com/package/argon2
    Argon2 = require('./node/Argon2-Node').default
}

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

        if (myHash.length !== initialHash.length)
            return false;

        for (let i=0; i<initialHash.length; i++)
            if (initialHash[i] !== myHash[i])
                return false;

        return true;

    }
    else
    if (typeof initialHash === 'string') {
        myHash = await Argon2.hashString(data);

        return myHash === initialHash;
    }

    return false;

}

export default Argon2