module.exports = function (self) {

    self.addEventListener('message',async (ev) => {


        if (ev.data.message === "new-nonces" || ev.data.message === "initialize" ){

            if (ev.data.message === "initialize"){

                if (ev.data.method !== undefined) self.method = ev.data.method;
                if (ev.data.block !== undefined) self.block = ev.data.block;

            }

            let bestHash, bestNonce;

            while (ev.data.count > 0){

                let hash = await self.block.computeHash(ev.data.nonce);

                if ( bestHash === undefined || hash.compare(bestHash) <= 0 ) {
                    bestHash = hash;
                    bestNonce = ev.data.nonce;
                }

                ev.data.nonce ++ ;
                ev.data.count --;
            }

            self.postMessage({message: "results", hash:bestHash, nonce: bestNonce, });

        }

        var startNum = parseInt(ev.data); // ev.data=4 from main.js

        setInterval(function () {
            var r = startNum / Math.random() - 1;
            self.postMessage([ startNum, r, gamma(r) ]);
        }, 500);
    });

};




var calcHashArg;

self.onmessage = function(e) {
    self.postMessage('calc:' + e.data.calc);
    calcHashArg = e.data.arg;
    switch (e.data.calc) {
        case 'asm':
            calcAsmJs();
            break;
        case 'wasm':
            calcWasm();
            break;
    }
};

function clearLog() {
}

function log(msg) {
    self.postMessage({ msg: msg });
}

function loadScript(script, callback, errorCallback) {
    try {
        importScripts(script);
    } catch (e) {
        console.error('Error loading script', script, e);
        errorCallback(e);
        return;
    }
    callback();
}

function getArg() {
    return calcHashArg;
}


self.postMessage({ msg: 'Worker started' });