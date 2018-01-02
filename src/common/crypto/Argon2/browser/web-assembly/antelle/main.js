/*
    original source https://github.com/antelle/argon2-browser/blob/master/docs/js/main.js
 */

/*
    Changed to Accept Arguments
    Changed to Class Instance
 */

class Argon2BrowserAntelleMain{

    constructor(){

        this.worker = null;
        this.pnaclTs = null;
        this.logTs = 0;

    }

    loadScript(src, onload, onerror) {

        var el = document.createElement("script");
        el.src = src;
        el.onload = onload;
        el.onerror = onerror;
        document.body.appendChild(el);
    }

    calcWorker(method, arg) {

        //this.clearLog();

        if (this.worker) {
            if (this.worker.method === method) {
                //this.log('Using loaded worker');
                this.worker.postMessage({ calc: method, arg: arg });
                return;
            } else {
                this.worker.terminate();
            }
        }

        //this.log('Starting worker...');
        this.worker = new Worker('js/worker.js');
        this.worker.method = method;

        var loaded = false;

        this.worker.onmessage = (e) => {
            //this.log(e.data.msg);
            if (!loaded) {
                loaded = true;
                this.worker.postMessage({ calc: method, arg: arg });
            }
        };
    }


    calcPNaCl(arg) {

        window.Module = null;
        //this.clearLog();

        if (!navigator.mimeTypes['application/x-pnacl']) {
            throw 'PNaCl is not supported by your browser';
        }

        //this.log('Testing Argon2 using PNaCl');

        var listener = document.getElementById('pnaclListener');
        var moduleEl = document.getElementById('pnacl-argon2');

        this.pnaclTs = performance.now();
        if (moduleEl) {
            moduleEl.postMessage(arg);
            return;
        }

        //this.log('Loading PNaCl module...');

        moduleEl = document.createElement('embed');
        moduleEl.setAttribute('name', 'argon2');
        moduleEl.setAttribute('id', 'pnacl-argon2');
        moduleEl.setAttribute('width', '0');
        moduleEl.setAttribute('height', '0');
        moduleEl.setAttribute('src', 'argon2.nmf');
        moduleEl.setAttribute('type', 'application/x-pnacl');

        listener.addEventListener('load', function() {
            //this.log('PNaCl module loaded in ' + Math.round(performance.now() - this.pnaclTs) + 'ms');
            //this.log('Calculating hash....');
            this.pnaclTs = performance.now();
            moduleEl.postMessage(arg);
        }, true);
        listener.addEventListener('message', function(e) {

            var encoded = e.data.encoded;
            var hash = e.data.hash;
            if (e.data.res) {
                //this.log('Error: ' + e.data.res + ': ' + e.data.error);
            } else {
                //this.log('Encoded: ' + encoded);
                //this.log('Hash: ' + hash);
                //this.log('Elapsed: ' + Math.round(performance.now() - pnaclTs) + 'ms');
            }
        }, true);
        listener.addEventListener('error', function() { console.log('Error'); }, true);
        listener.addEventListener('crash', function() { console.log('Crash'); }, true);

        listener.appendChild(moduleEl);
        moduleEl.offsetTop; // required by PNaCl
    }

    leftPad(str, len) {

        str = str.toString();
        while (str.length < len) {
            str = '0' + str;
        }
        return str;
    }

    clearLog() {

        // this.logTs = performance.now();
        //
        // let txtRes  = document.getElementById('txtRes')
        //
        // if (txtRes !== null)
        //     txtRes.value = '';
    }

    log(msg) {
        // if (!msg) {
        //     return;
        // }
        //
        // var txtRes = document.getElementById('txtRes');
        // var elapsedMs = Math.round(performance.now() - this.logTs);
        // var elapsedSec = (elapsedMs / 1000).toFixed(3);
        // var elapsed = this.leftPad(elapsedSec, 6);
        //
        // if (txtRes !== null)
        //     txtRes.value += (txtRes.value ? '\n' : '') + '[' + elapsed + '] ' + msg;
    }


}


export default new Argon2BrowserAntelleMain();