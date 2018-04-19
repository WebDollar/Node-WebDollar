const Pool = require('threads').Pool;

class ThreadPool {

    constructor(numThreads = 1){
        this.pool = new Pool(numThreads);
        
        this.pool
        .on('done', (job, message) => {
            console.log('Job done:', message);
        })
        .on('error', (job, error) => {
            console.error('Job errored:', error);
        })
        .on('finished', () => {
            console.log('Thread pool finished properly!!!.');
            this.pool.killAll();
        });
    }

    addWorker(){

    }

    removeWorker(){

    }
    
    setWorkers(value){

    }

    addTask(taskCallback, inputData) {
        this.pool.run(taskCallback).send(inputData);
    }

}

function callback(input, done) {
    console.log("Callback: ", input);
    done("Task had been finished");
}

let TP = new ThreadPool(4);

for (let i = 0; i < 100; ++i){
    TP.addTask(callback, i);
}

//export default ThreadPool;
