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

    runTask(task, message) {

        if (typeof task === "string") {
            this.pool.run(task).send({ do : message });
        }
    }

    _runDemo() {

// Run a script
        this.pool.run('src/common/threads/Worker.js').send({ do : 'something' });

//Send a task
        this.pool.send({ do : 'something else' });

// Run inline code
        const jobC = this.pool.run(
            function(input, done) {
                console.log("job C input:", input);
                let output = input + "<-modified";
                done(output, input);
            }, {
                // dependencies; resolved using node's require() or the web workers importScript()
                // md5 : 'js-md5'
            }
        ).send('Hash this string!');

        jobC.on('done', function(hash, input) {
            console.log(`Job C hashed: md5("${input}") = "${hash}"`);
        });

        this.pool.on('done', function(job, message) {
            console.log('Job done:', message);
            console.log();
        })
            .on('error', function(job, error) {
                console.error('Job errored:', error);
            })
            .on('finished', function() {
                console.log('Thread pool finished properly!!!.');
                pool.killAll();
            });
    }
}


//export default ThreadPool;
