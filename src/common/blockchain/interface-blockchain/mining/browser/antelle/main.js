var worker;
function calcWorker(method) {
    //clearLog();
    if (worker) {
        if (worker.method === method) {
            log('Using loaded worker');
            worker.postMessage({ calc: method, arg: { pass:"TEST", salt: 'WebDollar_make_$', time: 2, mem: 1024, parallelism: 2, type: 0, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist'} });
            return;
        } else {
            worker.terminate();
        }
    }
    console.log('Starting worker...');
    worker = new Worker('http://127.0.0.1:8080/public/worker.js');
    worker.method = method;
    var loaded = false;
    worker.onmessage = function(e) {
        console.log(e.data.msg);
        if (!loaded) {
            loaded = true;
            worker.postMessage({ calc: method, arg: { pass:"TEST", salt: 'WebDollar_make_$', time: 2, mem: 1024, parallelism: 2, type: 0, hashLen: 32, distPath: 'https://antelle.github.io/argon2-browser/dist'} });
        }
    };
}

export default calcWorker;