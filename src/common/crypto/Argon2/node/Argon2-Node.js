const argon2 = require('argon2');

const HASH_ARGON2_OPTIONS = { timeCost: 4, memoryCost: 13, parallelism: 2, type: argon2.argon2d }

class Argon2Node {

    async hash(data, salt){

        try{

            let hash = await argon2.hash(data, salt, {
                raw: false,
                options : HASH_ARGON2_OPTIONS,
            })

            return hash;


        } catch (Exception){
            console.log("Argon2 exception ", Exception.message, Exception.code)

            throw Exception
        }

    }

    async hashString(data, salt){

        try{

            let hash = await argon2.hash(data, salt, {
                raw: true,
                options : HASH_ARGON2_OPTIONS,
            })

            return hash;


        } catch (Exception){
            console.log("Argon2 exception ", Exception.message, Exception.code)

            throw Exception
        }

    }

    async verify(){

    }

}

export default new Argon2Node()