const Pool = require('threads').Pool;

class ThreadPool {

    constructor(numWorkers = 1){
        this._pool = new Pool(numWorkers);
        this._queue = [];

        this._updateNumWorkers = false;
        this._numWorkers = numWorkers;

        this._setUpPoolEvents();
    }

    _setUpPoolEvents() {
        this._pool
            .on('done', (job, message) => {
                //console.log('Job done:', message);
            })
            .on('error', (job, error) => {
                //console.error('Job errored:', error);
            })
            .on('finished', () => {
                console.log('Thread pool finished properly!!!.');
                this._pool.killAll();

                if (this._updateNumWorkers === true) {
                    this._pool = new Pool(this._numWorkers);

                    for (let i = 0; i < this._queue.length; ++i)
                        this._pool.run(this._queue[i].taskCallback).send(this._queue[i].inputData);

                    this._queue = [];
                    this._updateNumWorkers = false;
                    this._setUpPoolEvents();
                }

            });
    }

    setWorkers(numWorkers){
        this._updateNumWorkers = true;
        this._numWorkers = numWorkers;
        this._queue = [];
    }

    addTask(taskCallback, inputData) {
        if (this._updateNumWorkers === false)
            this._pool.run(taskCallback).send(inputData);
        else
            this._queue.push({taskCallback: taskCallback, inputData: inputData});
    }

}

function callback(input, done) {
    console.log("Callback: ", input);
    done("Task had been finished");
}
/*
let TP = new ThreadPool(4);

for (let i = 0; i < 10000; ++i){
    TP.addTask(callback, i);
}*/

export default ThreadPool;
