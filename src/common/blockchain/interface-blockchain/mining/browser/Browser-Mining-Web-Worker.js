

let jobTerminated = false; //is not working and jobTermianted is not reliable in the Worker....
let block = undefined;
let ARGON2_PARAM = { salt: 'Satoshi_is_Finney', time: 2, mem: 256, parallelism: 2, type: 0, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist'}

let algorithm = undefined;

let nonceArray = new Uint8Array(4);

export default function (self) {

    var _librayLoaded = false;
    var _libraryLoadPromise = false;

    var global = typeof window === 'undefined' ? self : window;
    var root = "https://antelle.net/argon2-browser/";

    function calcAsmJs() {

        let promise = new Promise( async (resolve) => {

            // log('Testing Argon2 using asm.js...');

            if (global.Module && !global.Module.wasmJSMethod) {

                if (!_librayLoaded) await _libraryLoadPromise;

                resolve ( calcHash() );
                return;

            }

            _librayLoaded = false;
            global.Module = {
                print: log,
                printErr: log,
                setStatus: log
            };

            var ts = now();
            //log('Loading script...');

            loadScript(root + 'dist/argon2-asm.min.js', () => {
                //log('Script loaded in ' + Math.round(now() - ts) + 'ms');
                //log('Calculating hash....');

                _librayLoaded = true;
                resolve(calcHash())

            }, () => {

                _librayLoaded = true;
                log('Error loading script');
            });

            // calcBinaryen(arg, 'asmjs');

        });

        if (!_librayLoaded)
            _libraryLoadPromise = promise;

        return promise;
    }

    function calcWasm() {
        return calcBinaryen('native-wasm');
    }

    function calcBinaryenSexpr() {
        return calcBinaryen('interpret-s-expr');
    }

    function calcBinaryenBin() {
        return calcBinaryen('interpret-binary');
    }

    function calcBinaryen(method) {

        let promise =  new Promise (async (resolve)=>{

            if (!global.WebAssembly) {

                log('Your browser doesn\'t support WebAssembly, please try it in Chrome Canary or Firefox Nightly with WASM flag enabled');
                return resolve(null); // return
            }

            //log('Testing Argon2 using Binaryen ' + method);
            if (global.Module && global.Module.wasmJSMethod === method && global.Module._argon2_hash) {
                //log('Calculating hash.... WASM optimized');

                if (!_librayLoaded) await _libraryLoadPromise;

                return resolve (calcHash());
            }

            _librayLoaded = false;

            const KB = 1024 * 1024;
            const MB = 1024 * KB;
            const GB = 1024 * MB;
            const WASM_PAGE_SIZE = 64 * 1024;

            const totalMemory = (2*GB - 64*KB) / 1024 / WASM_PAGE_SIZE;
            const initialMemory = Math.min(Math.max(Math.ceil(ARGON2_PARAM.mem * 1024 / WASM_PAGE_SIZE), 256) + 256, totalMemory);

            log('Memory: ' + initialMemory + ' pages (' + Math.round(initialMemory * 64) + ' KB)', totalMemory);

            const wasmMemory = new WebAssembly.Memory({
                initial: initialMemory,
                maximum: totalMemory
            });

            global.Module = {
                print: log,
                printErr: log,
                setStatus: log,
                wasmBinary: null,
                wasmJSMethod: method,
                asmjsCodeFile: root + 'dist/argon2-asm.min.asm.js',
                wasmBinaryFile: root + 'dist/argon2.wasm',
                wasmTextFile: root + 'dist/argon2.wast',
                wasmMemory: wasmMemory,
                buffer: wasmMemory.buffer,
                TOTAL_MEMORY: initialMemory * WASM_PAGE_SIZE
            };

            log('Loading wasm...');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', root + 'dist/argon2.wasm', true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = () => {
                global.Module.wasmBinary = xhr.response;
                global.Module.postRun = () => resolve(calcHash());
                var ts = now();
                log('Wasm loaded, loading script...');
                loadScript(root + 'dist/argon2.min.js', () => {
                    log('Script loaded in ' + Math.round(now() - ts) + 'ms');
                    log('Calculating hash....');

                    _librayLoaded = true;

                }, () => {

                    _librayLoaded = true;
                    log('Error loading script');

                });
            };
            xhr.onerror = () => {
                log('Error loading wasm');
            };
            xhr.send(null);

        });

        if (!_librayLoaded)
            _libraryLoadPromise = promise;

        return promise;

    }

    function calcHash() {

        var hashArr = new Uint8Array(32);


        if (!Module._argon2_hash)
            return hashArr;


        //var dt = now();
        var pwd = allocateArray( ARGON2_PARAM.pass);
        var salt = allocateArray( ARGON2_PARAM.salt );
        var hash = Module.allocate(new Array( ARGON2_PARAM.hashLen ), 'i8', Module.ALLOC_NORMAL);
        var encoded = Module.allocate(new Array(512), 'i8', Module.ALLOC_NORMAL);
        var err;
        try {

            var res = Module._argon2_hash(ARGON2_PARAM.time, ARGON2_PARAM.mem, ARGON2_PARAM.parallelism, pwd, ARGON2_PARAM.pass.length, salt, ARGON2_PARAM.salt.length,
                hash, ARGON2_PARAM.hashLen, encoded, 512,
                ARGON2_PARAM.type, 0x13);

        } catch (e) {
            err = e;
        }
        //var elapsed = now() - dt;
        if (res === 0 && !err) {

            /**
             * changed by Alexandru Ionut Budisteanu
             * to return UInt8Array aka Buffer
             */


            for (var i = hash; i < hash + ARGON2_PARAM.hashLen; i++)
                hashArr[i-hash] = Module.HEAP8[i];

        }  else {
            try {
                if (!err)
                    err = Module.Pointer_stringify(Module._argon2_error_message(res))
            } catch (e) {
            }
            log('Error: ' + res + (err ? ': ' + err : ''));
        }
        try {
            Module._free(pwd);
            Module._free(salt);
            Module._free(hash);
            Module._free(encoded);
        } catch (e) { }

        return hashArr;
    }

    function allocateArray(strOrArr) {
        var arr = strOrArr instanceof Uint8Array || strOrArr instanceof Array ? strOrArr
            : Module.intArrayFromString(strOrArr);
        return Module.allocate(arr, 'i8', Module.ALLOC_NORMAL);
    }

    function now() {
        return global.performance ? performance.now() : Date.now();
    }

    /**
     * This will load scripts/WASM files in a web worker
     * @param script
     * @param callback
     * @param errorCallback
     */
    let loadScript =  (script, callback, errorCallback) => {
        try {
            importScripts(script);
        } catch (e) {
            console.error('Error loading script', script, e);
            errorCallback(e);
            return;
        }
        callback();
    };



    var log = (msg) => {
        if (!msg )
            return;
        self.postMessage({message: "log", log: msg});
    };

    self.addEventListener('message', async function (ev) {

        if (ev.data.message === "terminate"){ //JOB TERMINATED
            //log("message received to TERMINATE..."+jobTerminated);
            jobTerminated = true;

        } else
        //it will initialize the PoW Algorithm
        if (ev.data.message === "initialize-algorithm"){

            ARGON2_PARAM.pass = new Uint8Array(10);

            let answer = await calcWasm();

            if (answer === null) { //Web Assembly failed

                answer = await calcAsmJs();

                if (answer === null) {
                    algorithm = null;
                    self.postMessage({message: "algorithm", answer:"no algorithm supported", });
                } else {
                    algorithm = calcAsmJs;
                    self.postMessage({message: "algorithm", answer:"ASM.JS supported", });
                }

            } else {
                algorithm = calcWasm;
                self.postMessage({message: "algorithm", answer:"WebAssembly supported", });
            }


        } else
        if (ev.data.message === "new-nonces" || ev.data.message === "initialize" ) {

            if (ev.data.message === "initialize") {

                jobTerminated = false;

                if (ev.data.block !== undefined && ev.data.block !== null) {
                    block = ev.data.block;

                    //solution using Uint8Array
                    ARGON2_PARAM.pass = new Uint8Array(block.length + 4 );
                    ARGON2_PARAM.pass.set(block);

                }

                log({message: "worker initialize"});

            }

            if (block === undefined) return; //block is not defined
            if (algorithm === undefined) {
                log("worker can't mine");
                return;
            }

            let bestHash, bestNonce;

            let nonce = ev.data.nonce;
            let noncePrevious = nonce;

            while (ev.data.count > 0 && !jobTerminated){

                nonceArray [3] = nonce & 0xff;
                nonceArray [2] = nonce>>8 & 0xff;
                nonceArray [1] = nonce>>16 & 0xff;
                nonceArray [0] = nonce>>24 & 0xff;

                ARGON2_PARAM.pass.set(nonceArray, block.length);

                let hash = await algorithm ();

                // compare lengths - can save a lot of time

                let change = false;

                if (bestHash === undefined) change = true;
                else
                    for (let i = 0, l = bestHash.length; i < l; i++)
                        if (hash[i] < bestHash[i]) {
                            change = true;
                            break;
                        }
                        else if (hash[i] > bestHash[i])
                            break;


                if ( change ) {
                    bestHash = hash;
                    bestNonce = nonce;
                }

                nonce ++ ;
                ev.data.count --;

                if (nonce % 3 === 0) {
                    self.postMessage({message: "worker nonce worked", nonce: nonce, nonceWork: nonce - noncePrevious});
                    noncePrevious = nonce;
                }


            }



            if (jobTerminated === false) //not terminated
                self.postMessage({message: "results", hash:bestHash, nonce: bestNonce, block: block, });
            else
                log("job terminated");


        }

    });

};
