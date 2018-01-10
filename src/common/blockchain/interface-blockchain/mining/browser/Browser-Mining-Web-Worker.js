import Argon2WebAssemblyCalcClass  from "common/crypto/Argon2/browser/web-assembly/antelle/calc.js";
let Argon2WebAssemblyCalc = new Argon2WebAssemblyCalcClass();

/**
 * This will load scripts/WASM files in a web worker
 * @param script
 * @param callback
 * @param errorCallback
 */
let loadScriptWorker = function (script, callback, errorCallback) {
    try {
        importScripts(script);
    } catch (e) {
        console.error('Error loading script', script, e);
        errorCallback(e);
        return;
    }
    callback();
};

Argon2WebAssemblyCalc.loadScript = loadScriptWorker;

var jobTerminated = false; //is not working and jobTermianted is not reliable in the Worker....
var method = undefined;
var block = undefined;
var ARGON2_PARAM = { salt: 'WebDollar_make_$', time: 2, mem: 1024, parallelism: 2, type: 0, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist'}

var algorithm = undefined;

module.exports = function (self) {

    let log = (msg) => {
        if (!msg ) return;
        self.postMessage({message: "log", log: msg});
    };
    Argon2WebAssemblyCalc.log = log;

    self.addEventListener('message',function (ev) {

        if (ev.data.message === "terminate"){ //JOB TERMINATED
            //log("message received to TERMINATE..."+jobTerminated);
            jobTerminated = true;

        } else
        //it will initialize the PoW Algorithm
        if (ev.data.message === "initialize-algorithm"){

            let params = ARGON2_PARAM;
            params.pass = new Uint8Array(10);

            Argon2WebAssemblyCalc.calc(Argon2WebAssemblyCalc.calcWasm, params).then((answer)=>{

                if (answer === null) { //Web Assembly failed

                    Argon2WebAssemblyCalc.calc(Argon2WebAssemblyCalc.calcAsmJs, params).then((answer)=>{

                        if (answer === null) {
                            algorithm = null;
                            self.postMessage({message: "algorithm", answer:"no algorithm supported", });
                        } else {
                            algorithm = Argon2WebAssemblyCalc.calcAsmJs;
                            self.postMessage({message: "algorithm", answer:"ASM.JS supported", });
                        }

                    });

                } else {
                    algorithm = Argon2WebAssemblyCalc.calcWasm;
                    self.postMessage({message: "algorithm", answer:"WebAssembly supported", });
                }

            });

        } else
        if (ev.data.message === "new-nonces" || ev.data.message === "initialize" ){

            if (ev.data.message === "initialize"){

                jobTerminated = false;

                if (ev.data.block !== undefined && ev.data.block !== null) block = ev.data.block;
                //else return;

                log({message:"worker initialize", block: block});

            }

            if (block === undefined) return; //block is not defined

            let bestHash, bestNonce;

            let params = ARGON2_PARAM;

            let nonce = ev.data.nonce;

            let chainNext = ()=>{

                if (ev.data.count === 0 || jobTerminated) return new Promise((resolve)=>{resolve(true)});

                //solution using Uint8Array
                params.pass = new Uint8Array(block.length + 4);
                params.pass.set(block);

                let nonceArray = new Uint8Array(4);
                nonceArray [3] = nonce & 0xff;
                nonceArray [2] = nonce>>8 & 0xff;
                nonceArray [1] = nonce>>16 & 0xff;
                nonceArray [0] = nonce>>24 & 0xff;

                params.pass.set(nonceArray, block.length);

                //log(nonce)
                //log(params.pass)

                // https://stackoverflow.com/questions/43780163/javascript-while-loop-where-condition-is-a-promise
                return Argon2WebAssemblyCalc.calc( algorithm , params).then((hash)=>{

                        //let hash = await block.computeHash(ev.data.nonce);

                        hash = hash.hash;

                        // compare lengths - can save a lot of time

                        let change = false;

                        if (bestHash === undefined) change = true;
                        else
                            for (let i = 0, l=bestHash.length; i < l; i++)
                                if (hash[i] < bestHash[i]) {
                                    change = true;
                                    break;
                                }
                                else if (hash[i] > bestHash[i]) break;


                        if ( change ) {
                            bestHash = hash;
                            bestNonce = nonce;
                        }

                        nonce ++ ;
                        ev.data.count --;

                        return chainNext();

                    });

            };

            chainNext().then((answer)=>{

                if (jobTerminated === false) //not terminated
                    self.postMessage({message: "results", hash:bestHash, nonce: bestNonce, block: block, });
                else
                    log("job terminated");
            });


        }

    });

};
