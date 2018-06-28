/*
    original source https://github.com/antelle/argon2-browser/blob/master/docs/js/calc.js

    Change to Class
    Adopted to Return Promises
    Removed setTimeOut... because we need it to be synchronized through promises
 */

import Argon2BrowserAntelleMain from './main'

var global =  typeof window === "undefined" ? self : window;
//var root =  window === undefined ? '../' : '';
var root = "https://antelle.net/argon2-browser/";

class Argon2BrowserWebAssemblyCalc{

    constructor(){

        this._libraryLoadPromise = null;
        this._librayLoaded = false;

    }

    calc(fn, arg) {
        try {
            return fn.call(this, arg);
        } catch (e) {
            console.log('Error Argon2', e);
            //log('Error: ' + e);
            return null;
        }
    }

    calcAsmJs(arg) {

        //this.clearLog();

        let promise = new Promise( async (resolve) => {

            // this.log('Testing Argon2 using asm.js...');

            if (global.Module && !global.Module.wasmJSMethod) {

                if (!this._librayLoaded) await this._libraryLoadPromise;

                resolve ( this.calcHash(arg) );
                return;

            }

            this._librayLoaded = false;
            global.Module = {
                print: this.log,
                printErr: this.log,
                setStatus: this.log
            };

            var ts = this.now();
            //this.log('Loading script...');

            this.loadScript(root + 'dist/argon2-asm.min.js', () => {
                //this.log('Script loaded in ' + Math.round(this.now() - ts) + 'ms');
                //this.log('Calculating hash....');

                this._librayLoaded = true;
                resolve(this.calcHash(arg))

            }, () => {

                this._librayLoaded = true;
                this.log('Error loading script');
            });

            // this.calcBinaryen(arg, 'asmjs');

        });

        if (!this._librayLoaded)
            this._libraryLoadPromise = promise;

        return promise;
    }

    calcWasm(arg) {
        return this.calcBinaryen(arg,'native-wasm');
    }

    calcBinaryenSexpr(arg) {
        return this.calcBinaryen(arg,'interpret-s-expr');
    }

    calcBinaryenBin(arg) {
        return this.calcBinaryen(arg, 'interpret-binary');
    }

    calcBinaryen(arg, method) {

        this.clearLog();

        let promise =  new Promise (async (resolve)=>{

            if (!global.WebAssembly) {

                this.log('Your browser doesn\'t support WebAssembly, please try it in Chrome Canary or Firefox Nightly with WASM flag enabled');

                resolve(null); // return

                return;
            }

            const mem = arg.mem;

            //this.log('Testing Argon2 using Binaryen ' + method);
            if (global.Module && global.Module.wasmJSMethod === method && global.Module._argon2_hash) {
                //this.log('Calculating hash.... WASM optimized');

                if (!this._librayLoaded) await this._libraryLoadPromise;

                resolve (this.calcHash(arg));
                return;
            }

            this._librayLoaded = false;

            const KB = 1024 * 1024;
            const MB = 1024 * KB;
            const GB = 1024 * MB;
            const WASM_PAGE_SIZE = 64 * 1024;

            const totalMemory = (2*GB - 64*KB) / 1024 / WASM_PAGE_SIZE;
            const initialMemory = Math.min(Math.max(Math.ceil(mem * 1024 / WASM_PAGE_SIZE), 256) + 256, totalMemory);

            this.log('Memory: ' + initialMemory + ' pages (' + Math.round(initialMemory * 64) + ' KB)', totalMemory);
            const wasmMemory = new WebAssembly.Memory({
                initial: initialMemory,
                maximum: totalMemory
            });

            global.Module = {
                print: this.log,
                printErr: this.log,
                setStatus: this.log,
                wasmBinary: null,
                wasmJSMethod: method,
                asmjsCodeFile: root + 'dist/argon2-asm.min.asm.js',
                wasmBinaryFile: root + 'dist/argon2.wasm',
                wasmTextFile: root + 'dist/argon2.wast',
                wasmMemory: wasmMemory,
                buffer: wasmMemory.buffer,
                TOTAL_MEMORY: initialMemory * WASM_PAGE_SIZE
            };

            this.log('Loading wasm...');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', root + 'dist/argon2.wasm', true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = () => {
                global.Module.wasmBinary = xhr.response;
                global.Module.postRun = () => resolve(this.calcHash(arg));
                var ts = this.now();
                this.log('Wasm loaded, loading script...');

                this.loadScript(root + 'dist/argon2.min.js', () => {
                    this.log('Script loaded in ' + Math.round(this.now() - ts) + 'ms');
                    this.log('Calculating hash....');

                    this._librayLoaded = true;

                }, () => {

                    this._librayLoaded = true;
                    this.log('Error loading script');

                });
            };
            xhr.onerror = () => {
                this.log('Error loading wasm');
            };
            xhr.send(null);

        });

        if (!this._librayLoaded)
            this._libraryLoadPromise = promise;

        return promise;

    }

    calcHash(arg) {

        if (!Module._argon2_hash) {
            this.log('Error Calculate Hash');
            return null;
        }

        let result = null;

        //this.log('Params: ' + Object.keys(arg).map(function(key) { return key + '=' + arg[key]; }).join(', '));

        var dt = this.now();

        var t_cost = arg && arg.time || 10;
        var m_cost = arg && arg.mem || 1024;
        var parallelism = arg && arg.parallelism || 1;
        //var pwd = Module.allocate( arg.pass , 'i8', Module.ALLOC_NORMAL);
        var pwd = this.allocateArray(arg && arg.pass || 'password');
        var pwdlen = arg && arg.pass ? arg.pass.length : 8;
        //var salt = Module.allocate(Module.intArrayFromString(arg && arg.salt || 'somesalt'), 'i8', Module.ALLOC_NORMAL);
        var salt =this.allocateArray(arg && arg.salt || 'somesalt');
        var saltlen = arg && arg.salt ? arg.salt.length : 8;
        var hash = Module.allocate(new Array(arg && arg.hashLen || 32), 'i8', Module.ALLOC_NORMAL);
        var hashlen = arg && arg.hashLen || 32;
        var encoded = Module.allocate(new Array(512), 'i8', Module.ALLOC_NORMAL);
        var encodedlen = 512;
        var argon2_type = arg && arg.type || 0;
        var version = 0x13;
        var err;
        try {
            var res = Module._argon2_hash(t_cost, m_cost, parallelism, pwd, pwdlen, salt, saltlen,
                hash, hashlen, encoded, encodedlen,
                argon2_type, version);
        } catch (e) {
            err = e;
        }
        var elapsed = this.now() - dt;
        if (res === 0 && !err) {

            /**
             * changed by Alexandru Ionut Budisteanu
             * to return UInt8Array aka Buffer
             */

            var hashArr = new Uint8Array(hashlen);
            for (var i = hash; i < hash + hashlen; i++) {
                hashArr[i-hash] = Module.HEAP8[i];
            }

            result = {
                hash: hashArr,
                //encoded:Module.Pointer_stringify(encoded),
                elapsed: elapsed
            };

            //console.log('Encoded: ' + result.encoded);
            // this.log('Hash: ' + result.hash);
            // this.log('Elapsed: ' + result.elapsed);



        } else {
            try {
                if (!err) {
                    err = Module.Pointer_stringify(Module._argon2_error_message(res))
                }
            } catch (e) {
            }
            this.log('Error: ' + res + (err ? ': ' + err : ''));
        }
        try {
            Module._free(pwd);
            Module._free(salt);
            Module._free(hash);
            Module._free(encoded);
        } catch (e) { }

        return result;
    }

    now() {
        return  typeof global.performance !== 'undefined' ? performance.now() : Date.now();
    }


    log(msg){

    }
    clearLog(){

    }

    loadScript(src, onload, onerror) {

        return new Promise( async (resolve)=>{

            for (let i=0; i < 20; i++){

                if ( document !== undefined && document.body !== undefined)
                    break;

                await this.sleep(10);

            }

            if (document !== undefined && document.body !== undefined){

                let el = document.createElement("script");
                el.src = src;
                el.onload = onload;
                el.onerror = onerror;
                document.body.appendChild(el);

                resolve(true);

            } else {
                onerror("error");
                resolve(false);
            }

        });
    }

    allocateArray(strOrArr) {
        var arr = strOrArr instanceof Uint8Array || strOrArr instanceof Array ? strOrArr
            : Module.intArrayFromString(strOrArr);
        return Module.allocate(arr, 'i8', Module.ALLOC_NORMAL);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

export default Argon2BrowserWebAssemblyCalc