let Argon2WebAssemblyCalcClass  = require ('common/crypto/Argon2/browser/web-assembly/antelle/calc.js').default;
let Argon2WebAssemblyCalc = new Argon2WebAssemblyCalcClass();

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

module.exports = function (self) {

    let log = (msg) => {
        if (!msg ) return;
        self.postMessage({message: "log", log: msg});
    };
    Argon2WebAssemblyCalc.log = log;


    self.addEventListener('message',function (ev) {

        if (ev.data.message === "new-nonces" || ev.data.message === "initialize" ){

            if (ev.data.message === "initialize"){

                if (ev.data.method !== undefined) self.method = ev.data.method;
                if (ev.data.block !== undefined) self.block = ev.data.block;

            }

            let bestHash, bestNonce;

            let params = { salt: 'WebDollar_make_$', time: 2, mem: 1024, parallelism: 2, type: 0, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist'};

            let nonce = ev.data.nonce;

            let chain = ()=>{

                if (ev.data.count === 0) return new Promise((resolve)=>{resolve(true)});

                //solution using Uint8Array
                params.pass = new Uint8Array(self.block.length + 4);
                params.pass.set(self.block);

                let nonceArray = new Uint8Array(4);
                nonceArray [0] = nonce & 0xff;
                nonceArray [1] = nonce>>8 & 0xff;
                nonceArray [2] = nonce>>16 & 0xff;
                nonceArray [3] = nonce>>24 & 0xff;

                params.pass.set(nonceArray, self.block.length);

                log(nonce)
                //log(params.pass)

                return new Promise((resolve)=>{

                    Argon2WebAssemblyCalc.calc(Argon2WebAssemblyCalc.calcWasm, params).then((hash)=>{

                        //let hash = await self.block.computeHash(ev.data.nonce);

                        hash = hash.hash;
                        log( hash);


                        // compare lengths - can save a lot of time
                        let change = false;
                        if (bestHash === undefined) change = true;
                        else
                        for (let i = 0, l=bestHash.length; i < l; i++)
                            if (hash[i] <= bestHash[i]) {
                                change = true;
                                break;
                            } else break;


                        if ( change ) {
                            bestHash = hash;
                            bestNonce = nonce;
                        }

                        nonce ++ ;
                        ev.data.count --;

                        chain().then((answer)=>{
                            resolve(true);
                        });

                    });

                })

            };

            chain().then((answer)=>{
                self.postMessage({message: "results", hash:bestHash, nonce: bestNonce, });
            });


        }

    });

};
