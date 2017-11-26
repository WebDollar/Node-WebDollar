const argon2 = require('argon2-browser').argon2;

                             //WebDollar_make_$
const HASH_ARGON2_OPTIONS = { salt: 'WebDollar_make_$', time: 4, mem: 8192, parallelism: 2, type: argon2.ArgonType.Argon2d, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist' }

class Argon2Browser{

    constructor(){

        if (typeof window !== 'undefined')
            window.argon2 = argon2;

    }

    async hash(data){

        try{

            let params = HASH_ARGON2_OPTIONS;
            params.pass = data

            let result = await argon2.hash(params);

            //console.log("ARgon2Browser", result.hash);
            return new Buffer(result.hash);

        } catch (Exception){
            console.log("Argon2 exception", Exception)

            throw Exception
        }

    }

    async hashString(data){

        try{

            let params = HASH_ARGON2_OPTIONS;
            params.pass = data

            let result = await argon2.hash( params );

            let hash = result.encoded.substr(-HASH_ARGON2_OPTIONS.hashLength)

            //console.log("ARgon2Browser", result.encoded, hash);

            return hash

        } catch (Exception){
            console.log("Argon2 exception", Exception)

            throw Exception
        }

    }


}

export default new Argon2Browser()