const argon2 = require('argon2-browser').argon2;
import consts from 'consts/const_global'

import Argon2BrowserWebAssembly from './web-assembly/Argon2-Browser-WebAssembly'

/*
    TUTORIAL BASED ON https://github.com/antelle/argon2-browser/blob/master/docs/test.html

    last update:

    14 Nov 2017
    https://github.com/antelle/argon2-browser/commit/2d37df355b76e7f1c261571393ad5350e8753a0b
 */


const HASH_ARGON2_OPTIONS = { salt: consts.HASH_ARGON2_PARAMS.salt, time: consts.HASH_ARGON2_PARAMS.time, mem: consts.HASH_ARGON2_PARAMS.memBytes, parallelism: consts.HASH_ARGON2_PARAMS.parallelism, type: consts.HASH_ARGON2_PARAMS.type, hashLen: consts.HASH_ARGON2_PARAMS.hashLen, distPath: consts.HASH_ARGON2_PARAMS.distPath}

class Argon2Browser{

    constructor(){

        if (process.env.BROWSER)
            window.argon2 = argon2;

    }

    async hash(data){

        let result;

        result = await Argon2BrowserWebAssembly.hash(data);

        if (result !== null) return result;

        return await this.hashJavascript(data);
    }

    async hashString(data){
        let result;

        result = await Argon2BrowserWebAssembly.hashString(data)

        if (result !== null) return result;

        return await this.hashJavascriptString()
    }

    async hashJavascript(data){

        try{

            let params = HASH_ARGON2_OPTIONS;
            params.pass = data;



            let result = await argon2.hash(params);

            //console.log("ARgon2Browser", result.hash);
            return new Buffer(result.hash);

        } catch (Exception){
            console.log("Argon2 exception hashJavascript", Exception)

            throw Exception
        }

    }

    async hashJavascriptString(data){

        try{

            let params = HASH_ARGON2_OPTIONS;
            params.pass = data

            let result = await argon2.hash( params );

            let hash = result.encoded.substr(result.encoded.lastIndexOf("$")+1)

            //console.log("ARgon2Browser", result.encoded, hash);

            return hash

        } catch (Exception){
            console.log("Argon2 exception hashJavascriptString", Exception)

            throw Exception
        }

    }


}

export default new Argon2Browser()