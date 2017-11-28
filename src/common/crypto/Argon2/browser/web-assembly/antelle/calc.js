/*
    original source https://github.com/antelle/argon2-browser/blob/master/docs/js/calc.js
 */
'use strict';

import Argon2BrowserAntelleMain from './main'

var global = typeof window === 'undefined' ? self : window;
var root = typeof window === 'undefined' ? '../' : '';

class Argon2BrowserWebAssemblyCalc{

    calc(fn, arg) {
        try {
            return fn(fn, arg);
        } catch (e) {
            log('Error: ' + e);
            return null;
        }
    }

    calcAsmJs(arg) {
        Argon2BrowserAntelleMain.clearLog();

        return new Promise( (resolve) => {

            Argon2BrowserAntelleMain.log('Testing Argon2 using asm.js...');
            if (global.Module && !global.Module.wasmJSMethod) {
                Argon2BrowserAntelleMain.log('Calculating hash....');
                setTimeout( ()=>{ resolve ( this.calcHash(arg) ) }, 10);
                return;
            }

            global.Module = {
                print: Argon2BrowserAntelleMain.log,
                printErr: Argon2BrowserAntelleMain.log,
                setStatus: Argon2BrowserAntelleMain.log
            };
            var ts = this.now();
            Argon2BrowserAntelleMain.log('Loading script...');
            loadScript(root + 'dist/argon2-asm.min.js', () => {
                Argon2BrowserAntelleMain.log('Script loaded in ' + Math.round(this.now() - ts) + 'ms');
                Argon2BrowserAntelleMain.log('Calculating hash....');

                setTimeout( ()=>{ resolve(this.calcHash(arg)) }, 10);

            }, () => {
                Argon2BrowserAntelleMain.log('Error loading script');
            });

            // calcBinaryen(arg, 'asmjs');

        });
    }

    calcWasm(arg) {
        calcBinaryen(arg,'native-wasm');
    }

    calcBinaryenSexpr(arg) {
        calcBinaryen(arg,'interpret-s-expr');
    }

    calcBinaryenBin(arg) {
        calcBinaryen(arg, 'interpret-binary');
    }

    calcBinaryen(arg, method) {

        Argon2BrowserAntelleMain.clearLog();

        return new Promise ((resolve)=>{

            if (!global.WebAssembly) {
                Argon2BrowserAntelleMain.log('Your browser doesn\'t support WebAssembly, please try it in Chrome Canary or Firefox Nightly with WASM flag enabled');
                return;
            }

            const mem = arg.mem;

            Argon2BrowserAntelleMain.log('Testing Argon2 using Binaryen ' + method);
            if (global.Module && global.Module.wasmJSMethod === method && global.Module._argon2_hash) {
                Argon2BrowserAntelleMain.log('Calculating hash....');
                setTimeout( () => {resolve (this.calcHash(arg)) }, 10);
                return;
            }

            const KB = 1024 * 1024;
            const MB = 1024 * KB;
            const GB = 1024 * MB;
            const WASM_PAGE_SIZE = 64 * 1024;

            const totalMemory = (2*GB - 64*KB) / 1024 / WASM_PAGE_SIZE;
            const initialMemory = Math.min(Math.max(Math.ceil(mem * 1024 / WASM_PAGE_SIZE), 256) + 256, totalMemory);

            Argon2BrowserAntelleMain.log('Memory: ' + initialMemory + ' pages (' + Math.round(initialMemory * 64) + ' KB)', totalMemory);
            const wasmMemory = new WebAssembly.Memory({
                initial: initialMemory,
                maximum: totalMemory
            });

            global.Module = {
                print: Argon2BrowserAntelleMain.log,
                printErr: Argon2BrowserAntelleMain.log,
                setStatus: Argon2BrowserAntelleMain.log,
                wasmBinary: null,
                wasmJSMethod: method,
                asmjsCodeFile: root + 'dist/argon2-asm.min.asm.js',
                wasmBinaryFile: root + 'dist/argon2.wasm',
                wasmTextFile: root + 'dist/argon2.wast',
                wasmMemory: wasmMemory,
                buffer: wasmMemory.buffer,
                TOTAL_MEMORY: initialMemory * WASM_PAGE_SIZE
            };

            Argon2BrowserAntelleMain.log('Loading wasm...');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', root + 'dist/argon2.wasm', true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                global.Module.wasmBinary = xhr.response;
                global.Module.postRun = calcHash(arg);
                var ts = this.now();
                Argon2BrowserAntelleMain.log('Wasm loaded, loading script...');
                loadScript(root + 'dist/argon2.min.js', function() {
                    Argon2BrowserAntelleMain.log('Script loaded in ' + Math.round(this.now() - ts) + 'ms');
                    Argon2BrowserAntelleMain.log('Calculating hash....');
                }, function() {
                    Argon2BrowserAntelleMain.log('Error loading script');
                });
            };
            xhr.onerror = function () {
                Argon2BrowserAntelleMain.log('Error loading wasm');
            };
            xhr.send(null);

        })

    }

    calcHash(arg) {
        if (!Module._argon2_hash) {
            return Argon2BrowserAntelleMain.log('Error');
        }

        let result = null;

        Argon2BrowserAntelleMain.log('Params: ' + Object.keys(arg).map(function(key) { return key + '=' + arg[key]; }).join(', '));
        var dt = this.now();
        var t_cost = arg && arg.time || 10;
        var m_cost = arg && arg.mem || 1024;
        var parallelism = arg && arg.parallelism || 1;
        var pwd = Module.allocate(Module.intArrayFromString(arg && arg.pass || 'password'), 'i8', Module.ALLOC_NORMAL);
        var pwdlen = arg && arg.pass ? arg.pass.length : 8;
        var salt = Module.allocate(Module.intArrayFromString(arg && arg.salt || 'somesalt'), 'i8', Module.ALLOC_NORMAL);
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
            var hashArr = [];
            for (var i = hash; i < hash + hashlen; i++) {
                hashArr.push(Module.HEAP8[i]);
            }

            result = {
                hash: hashArr.map(function(b) { return ('0' + (0xFF & b).toString(16)).slice(-2); }).join(''),
                encoded:Module.Pointer_stringify(encoded),
                elapsed: elapsed
            };

            Argon2BrowserAntelleMain.log('Encoded: ' + result.encoded);
            Argon2BrowserAntelleMain.log('Hash: ' + result.hash);
            Argon2BrowserAntelleMain.log('Elapsed: ' + result.elapsed);



        } else {
            try {
                if (!err) {
                    err = Module.Pointer_stringify(Module._argon2_error_message(res))
                }
            } catch (e) {
            }
            Argon2BrowserAntelleMain.log('Error: ' + res + (err ? ': ' + err : ''));
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
        return global.performance ? performance.now() : Date.now();
    }



}

export default new Argon2BrowserWebAssemblyCalc()