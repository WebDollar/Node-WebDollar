const Argon2WebAssemblyCalc  = require ('common/crypto/Argon2/browser/web-assembly/antelle/calc.js').default;

let Base64FromNumber = function(number) {
    if (isNaN(Number(number)) || number === null ||
        number === Number.POSITIVE_INFINITY)
        throw "The input is not valid";
    if (number < 0)
        throw "Can't represent negative numbers now";

    var rixit; // like 'digit', only in some non-decimal radix
    var residual = Math.floor(number);
    var result = '';
    while (true) {
        rixit = residual % 64

        result = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/".charAt(rixit) + result;

        residual = Math.floor(residual / 64);

        if (residual == 0)
            break;
    }
    return result;
}

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

            let chain = ()=>{

                if (ev.data.count === 0) return new Promise((resolve)=>{resolve(true)});

                params.pass = self.block + Base64FromNumber(ev.data.nonce);

                return new Promise((resolve)=>{

                    Argon2WebAssemblyCalc.calc(Argon2WebAssemblyCalc.calcAsmJs, params).then((hash)=>{

                        //let hash = await self.block.computeHash(ev.data.nonce);
                        hash = hash.hash;

                        // compare lengths - can save a lot of time
                        let change = false;
                        if (bestHash === undefined)
                            change = true;
                        else
                        for (let i = 0, l=bestHash.length; i < l; i++)
                            if (hash[i] <= bestHash[i]) {
                                change = true;
                                break;
                            }


                        if ( change ) {
                            bestHash = hash;
                            bestNonce = ev.data.nonce;
                        }

                        ev.data.nonce ++ ;
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
