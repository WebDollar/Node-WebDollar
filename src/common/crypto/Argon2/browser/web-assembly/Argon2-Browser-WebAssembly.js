import consts from 'consts/const_global'

require('antelle/calc.js')
require('antelle/main.js')
//require('antelle/worker.js')

/*
    TUTORIAL BASED ON https://github.com/antelle/argon2-browser/blob/master/docs/index.html
 */

const HASH_ARGON2_OPTIONS = { salt: consts.HASH_ARGON2_PARAMS.salt, time: consts.HASH_ARGON2_PARAMS.time, mem: consts.HASH_ARGON2_PARAMS.memBytes, parallelism: consts.HASH_ARGON2_PARAMS.parallelism, type: consts.HASH_ARGON2_PARAMS.type, hashLen: consts.HASH_ARGON2_PARAMS.hashLen, distPath: consts.HASH_ARGON2_PARAMS.distPath}

class Argon2BrowserWebAssembly{

    constructor(){

    }

    _calculateHashWorker(method, data){

        let params = HASH_ARGON2_OPTIONS;
        params.pass = data

        return calcWorker(method, params)
    }

    _calculateHash(method, data){
        let params = HASH_ARGON2_OPTIONS;
        params.pass = data

        return calc(method, params)
    }

    calcAsmJs(data){
        this._calculateHash(calcAsmJs, data)
    }

    calcWasm(data){
        this._calculateHash(calcWasm, data)
    }

    calcBinaryenSexpr(data){
        this._calculateHash(calcBinaryenSexpr, data)
    }

    calcBinaryenBin(data){
        this._calculateHash(calcBinaryenBin, data)
    }

    calcPNaCl(data){
        this._calculateHash(calcPNaCl, data)
    }

    calcWorkerAsm(data){
        this._calculateHashWorker('asm', data)
    }

    calcWorkerWasm(data){
        this._calculateHashWorker('wasm', data)
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