const Pool = require('threads').Pool;

class ThreadPool {

    constructor(numThreads = 1) {
        this.pool = new Pool(numThreads);
        this._runDemo();
    }

    addWorker() {

    }

    removeWorker() {

    }

    addTask(taskCallback, inputData) {
       this.pool.run(taskCallback).send(inputData);
    }

    _runDemo() {

//        this.pool.run('src/common/threads/Worker.js').send({ do : 'something' });
        this.pool
        .on('done', function(job, message) {
            console.log('Job done:', message);
            console.log();
        })
        .on('error', function(job, error) {
            console.error('Job errored:', error);
        })
        .on('finished', function() {
            console.log('Thread pool finished properly!!!.');
            this.pool.killAll();
        });
    }
}

function callback(input) {
    console.log("Callback: ", input);
}

let TP = new ThreadPool(4);
TP.addTask(callback, "cosmin");
TP.addTask(callback, "dumitru");
TP.addTask(callback, "oprea");

console.log();

export default ThreadPool;
