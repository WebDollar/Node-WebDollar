import consts from 'consts/const_global'

import Argon2WebAssemblyCalcClass from './antelle/calc.js'
let Argon2WebAssemblyCalc = new Argon2WebAssemblyCalcClass();

import Argon2WebAssemblyMain from './antelle/main.js'
import BufferExtended from "common/utils/BufferExtended";
//require('antelle/worker.js')

/*
    TUTORIAL BASED ON https://github.com/antelle/argon2-browser/blob/master/docs/index.html
 */

const HASH_ARGON2_OPTIONS = {
    salt: consts.HASH_ARGON2_PARAMS.salt,
    time: consts.HASH_ARGON2_PARAMS.time,
    mem: consts.HASH_ARGON2_PARAMS.memBytes,
    parallelism: consts.HASH_ARGON2_PARAMS.parallelism,
    type: consts.HASH_ARGON2_PARAMS.algoBrowser,
    hashLen: consts.HASH_ARGON2_PARAMS.hashLen,
    distPath: consts.HASH_ARGON2_PARAMS.distPath
}

class Argon2BrowserWebAssembly{


    /*
        Simple Hash
     */

    _calculateHash(method, params){

        try {
            let answer = Argon2WebAssemblyCalc.calc(method, params)

            return answer;
        } catch (Exception){
            console.log( '_calculateHashWorker raised exception', Exception );
            return null;
        }
    }

    async _calcBest(params){
        let result;


        try {
            result = await this._calculateHash(Argon2WebAssemblyCalc.calcWasm, params);
            if (result !== null) return result;
        } catch (ex){

        }

        try {
            result = await this._calculateHash(Argon2WebAssemblyCalc.calcAsmJs, params);
            if (result !== null) return result;
        } catch (ex){

        }


        try {
            result = await this._calculateHash(Argon2WebAssemblyCalc.calcBinaryenSexpr, params);
            if (result !== null) return result;
        } catch (ex){

        }

        try {
            result = await this._calculateHash(Argon2WebAssemblyCalc.calcBinaryenBin, params);
            if (result !== null) return result;
        } catch (ex){

        }

        try {
            result = await this._calculateHash(Argon2WebAssemblyMain.calcPNaCl, params);
            if (result !== null) return result;
        } catch (ex){

        }

        return null;
    }

    /*
        Workers
     */
    _calculateHashWorker(method, params){


        try {
            return Argon2WebAssemblyCalc.calcWorker(method, params)
        } catch (Exception){
            console.error('_calculateHashWorker raised exception', Exception)
            return null;
        }
    }

    calcWorkerAsm(data){
        this._calculateHashWorker('asm', data)
    }

    calcWorkerWasm(data){
        this._calculateHashWorker('wasm', data)
    }

    calcWorkerBest(data) {
        let result;

        result = this.calcWorkerAsm(data)
        if (result !== null) return result;

        result = this.calcWorkerWasm(data)
        if (result !== null) return result;
    }

    async hash(data){

        try{

            let params = HASH_ARGON2_OPTIONS;
            params.pass = data

            //console.log("params.pass", params.pass);

            //let result = await this._calcBest(params);
            let result = await this._calculateHash(Argon2WebAssemblyCalc.calcAsmJs, params);

            if (result === null) throw {message: "Argon2 returned empty"};

            //console.log("result", result)

            return new Buffer(result.hash);

        } catch (Exception){
            console.error("Argon2 exception hash", Exception)
            return null;
        }

    }

    async hashString(data){

        try{

            let params = HASH_ARGON2_OPTIONS;
            params.pass = data

            let result = await this._calcBest( params );

            // console.log("ARgon2Browser String", result);
            if (result === null) throw {message:"Argon2 returned empty"};

            return Buffer.from(result.hash).toString("hex");

            //let hash = result.encoded.substr( result.encoded.lastIndexOf("$")+1 )

            // console.log("hash string ", "hash=", hash, "data=",data)
            // console.log("hash string ", result.hash)

            // return hash

        } catch (Exception){
            console.error("Argon2 exception hashString", Exception);
            return null;
        }

    }


}

export default new Argon2BrowserWebAssembly()