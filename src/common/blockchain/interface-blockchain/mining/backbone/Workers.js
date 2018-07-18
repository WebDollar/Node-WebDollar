const FS = require('fs');
const OS = require('os');
const { fork } = require('child_process');
import consts from 'consts/const_global'

class Workers {
    /**
     * @param {InterfaceBlockchainBackboneMining} ibb
     *
     * @return {Workers}
     */
    constructor(ibb) {
        this.ibb = ibb;

        this._abs_end = 0xFFFFFFFF;
        this._default_resolve = {
            result: false,
            nonce: -1,
            hash: consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER
        };

        this._from_pool = undefined;

        // workers setup
        this._worker_path = consts.TERMINAL_WORKERS.PATH;
        if (!FS.existsSync(this._worker_path)) {
            console.log('Worker build is missing.');

            return false;
        }

        this.worker_batch = this.ibb.WORKER_NONCES_WORK || 500;
        this.workers_max = consts.TERMINAL_WORKERS.MAX || this._maxWorkersDefault() || 1;
        this.workers_list = [];
        this._working = 0;
        this._silent = consts.TERMINAL_WORKERS.SILENT;

        // target
        this.block = undefined;
        this.difficulty = undefined;

        // current work
        this._current = undefined;
        this._current_max = undefined;
        this._finished = false;
        this._final_batch = false;
        this._run_timeout = false;

    }

    haveSupport() {
        // disabled by miner
        if (consts.TERMINAL_WORKERS.MAX == -1) {
            return false;
        }

        // it needs at least 2
        if (this.workers_max <= 1) {
            return false;
        }

        return true;
    }

    max() {
        return this.workers_max;
    }

    run(start, end, loop_delay = 5) {
        this._current = start || 0;
        this._current_max = (end) ? end : this._abs_end;

        this.block = this.ibb.block;
        this.difficulty = this.ibb.difficulty;

        this._from_pool = true;
        if (this.block.height) {
            // if the given block has a height, it means it's mining solo.
            this._from_pool = false;
        }

        // resets
        this._finished = false;
        this._final_batch = false;

        this._initiateWorkers();

        this._loop(loop_delay);
    }

    _maxWorkersDefault() {
        return Math.floor(OS.cpus().length / 2);
    }

    _initiateWorkers() {

        for (let index = this.workers_list.length - 1; index < this.workers_max; index++)
            this._createWorker(index);

        return this;
    }

    _createWorker(index) {
        // { execArgv: [`--max_old_space_size=${Math.floor(os.totalmem()/1024/1024)}`] }
        const worker = fork(
            this._worker_path, {}, { silent: this._silent }
        );

        worker._is_batching = false;

        worker.on('message', (msg) => {
            // hashing: hashed one time, so we are incrementing hashes per second
            if (msg.type == 'h') {
                this.ibb._hashesPerSecond++;

                return false;
            }

            // solved: stop and resolve but with a solution
            if (msg.type == 's') {
                this._finished = true;

                this.ibb._workerResolve({
                    result: true,
                    nonce: parseInt(msg.solution.nonce),
                    hash: new Buffer(msg.solution.hash),
                });

                return false;
            }

            // batching: finished a batch of nonces
            if (msg.type == 'b') {
                worker._is_batching = false;

                // keep track of the ones that are working
                this._working--;

                // if none of the threads are working and we finished the range, then we should stop and resolve
                if (!this._working && this._current >= this._current_max) {
                    this._stopAndResolve();
                }

                return false;
            }
        });

        this.workers_list[index] = worker;

        return this;
    }

    _stopAndResolve() {
        this._finished = true;

        if (this._run_timeout) {
            clearTimeout(this._run_timeout);
        }

        this.ibb._workerResolve(this._default_resolve);

        return this;
    }

    _loop(_delay) {
        const ibb_halt = !this.ibb.started || this.ibb.resetForced || (this.ibb.reset && this.ibb.useResetConsensus);
        if (ibb_halt) {
            this._stopAndResolve();

            return false;
        }

        this.workers_list.forEach((worker, index) => {

            if (this._finished)
                return false;


            if (worker._is_batching)
                return false;


            if (this._final_batch)
                return false;

            worker._is_batching = true;

            // add only the rest
            if (this._current_max - this._current < this.worker_batch) {
                this._final_batch = this._current_max - this._current;
            }

            // keep track of the ones that are working
            this._working++;

            worker.send({
                command: 'start',
                data: {
                    block: (!this._from_pool) ? false : this.block,
                    height: (this._from_pool) ? false : this.block.height,
                    difficultyTargetPrev: (this._from_pool) ? false : this.block.difficultyTargetPrev,
                    computedBlockPrefix: (this._from_pool) ? false : this.block.computedBlockPrefix,
                    difficulty: this.difficulty,
                    start: this._current,
                    batch: this._final_batch ? this._final_batch : this.worker_batch,
                }
            });

            this._current += this.worker_batch;
        });

        // healthy loop delay
        this._run_timeout = setTimeout(() => {
            this._loop();
        }, _delay);

        return this;
    }
}

export default Workers;
