const argon2 = require('argon2');
//const argon2 = require('./node-argon2-master/');

                             //WebDollar_make_$
const HASH_ARGON2_OPTIONS = { salt: Buffer.from(['W','e','b','D','o','l','l','a','r','_','m','a','k','e','_','$']), timeCost: 4, memoryCost: 13, parallelism: 2, type: argon2.argon2d, hashLength: 32 }

class Argon2Node {

    async hash(data){

        try{

            let options = HASH_ARGON2_OPTIONS;
            options.raw = true;

            let hash = await argon2.hash(data, options)

            return hash;


        } catch (Exception){
            console.log("Argon2 exception ", Exception.message, Exception.code)

            throw Exception
        }

    }

    async hashString(data){

        try{

            let options = HASH_ARGON2_OPTIONS;
            options.raw = false;

            let hash = await argon2.hash(data, options)

            hash = hash.substr(-HASH_ARGON2_OPTIONS.hashLength)

            return hash;


        } catch (Exception){
            console.log("Argon2 exception ", Exception.message, Exception.code)

            throw Exception
        }

    }

    async verify(initialHash, data){

        let myHash;

        if (Buffer.isBuffer(initialHash)) {
            myHash = await this.hash(data);

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
            myHash = await this.hashString(data);

            return myHash === initialHash;
        }

        return false;

    }

}

export default new Argon2Node()