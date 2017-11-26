const argon2 = require('argon2');
import consts from 'consts/const_global'
//const argon2 = require('./node-argon2-master/');

const HASH_ARGON2_OPTIONS = { salt: consts.HASH_ARGON2_PARAMS.saltBuffer, timeCost: consts.HASH_ARGON2_PARAMS.time, memoryCost: consts.HASH_ARGON2_PARAMS.memPower, parallelism: consts.HASH_ARGON2_PARAMS.parallelism, type: consts.HASH_ARGON2_PARAMS.type, hashLength: consts.HASH_ARGON2_PARAMS.hashLen }

class Argon2Node {

    async hash(data){

        try{

            let options = HASH_ARGON2_OPTIONS;
            options.raw = true;

            return await argon2.hash(data, options)

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

}

export default new Argon2Node()