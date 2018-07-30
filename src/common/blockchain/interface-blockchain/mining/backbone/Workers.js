// Contributor: Adelin

import Serialization from "common/utils/Serialization";
import Argon2 from 'common/crypto/Argon2/Argon2'
import Log from 'common/utils/logging/Log';

const FS = require('fs');
const OS = require('os');
const { fork } = require('child_process');
//const fkill = require('fkill');

import consts from 'consts/const_global'
import ProcessWorkerCPP from "./Process-Worker-CPP";

class Workers {
    /**
     * @param {InterfaceBlockchainBackboneMining} ibb
     *
     * @return {Workers}
     */
    constructor(ibb) {
        this.ibb = ibb;

        this._abs_end = 0xFFFFFFFF;

        this._from_pool = undefined;

        // workers setup
        if (consts.TERMINAL_WORKERS.TYPE === "cpu") {

            this._worker_path = consts.TERMINAL_WORKERS.PATH;
            this.workers_max = consts.TERMINAL_WORKERS.CPU_MAX || this._maxWorkersDefault() || 1;
            this.worker_batch = consts.TERMINAL_WORKERS.CPU_WORKER_NONCES_WORK || 500;
            this.worker_batch_thread = this.worker_batch;
            this.ibb._avoidShowingZeroHashesPerSecond = false;

        } else if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp") {
            this._worker_path = consts.TERMINAL_WORKERS.PATH_CPP;
            this.workers_max = consts.TERMINAL_WORKERS.CPU_MAX || 1;
            this.worker_batch = consts.TERMINAL_WORKERS.CPU_CPP_WORKER_NONCES_WORK || 500;
            this.worker_batch_thread = consts.TERMINAL_WORKERS.CPU_CPP_WORKER_NONCES_WORK_BATCH || 500;
            this.ibb._avoidShowingZeroHashesPerSecond = true;
        }
        else if (consts.TERMINAL_WORKERS.TYPE === "gpu") {
            this._worker_path = consts.TERMINAL_WORKERS.PATH_GPU;
            this.workers_max = consts.TERMINAL_WORKERS.GPU_INSTANCES||1;
            this.worker_batch = consts.TERMINAL_WORKERS.GPU_WORKER_NONCES_WORK;
            this.worker_batch_thread = consts.TERMINAL_WORKERS.GPU_WORKER_NONCES_WORK_BATCH;
            this.ibb._avoidShowingZeroHashesPerSecond = true;
        } else {

            Log.error('NO WORKER SPECIFIED. Specify "cpu", "cpu-cpp", "gpu" ', Log.LOG_TYPE.default);
            
        }


        if (!FS.existsSync(this._worker_path)) {
            Log.error('Worker build is missing.', Log.LOG_TYPE.default);

            return false;
        }


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


        setInterval( this._makeUnresponsiveThreads.bind(this), 5000 );

    }

    _makeUnresponsiveThreads(){

        let date = new Date().getTime();

        if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" || consts.TERMINAL_WORKERS.TYPE === "gpu" )
            for (let i=0; i< this.workers_list.length; i++)
                if ( (date  - this.workers_list[i].date ) > 80000 ){
                    this.workers_list[i]._is_batching = false;
                    this.workers_list[i].date = new Date().getTime();
                }

        if ( this._current >= this._current_max )
            this._stopAndResolve();

    }

    haveSupport() {
        // disabled by miner
        if (consts.TERMINAL_WORKERS.CPU_MAX === -1)
            return false;

        // it needs at least 2
        if (this.workers_max <= 1)
            return false;

        return true;
    }

    stopMining(){

        try {

            for (let i = 0; i < this.workers_list.length; i++){
                if (this.workers_list[i] && typeof this.workers_list[i].kill === "function")
                    this.workers_list[i].kill('SIGINT');
            }

        } catch (exception){

        }

    }

    max() {
        return this.workers_max;
    }

    async run(start, end, loop_delay = 2) {
        this._current = start || 0;
        this._current_max = (end) ? end : this._abs_end;

        this.block = this.ibb.block;
        this.difficulty = this.ibb.difficulty;
        this.height = this.ibb.block.height;

        this._from_pool = true;
        if (this.block.height) {
            // if the given block has a height, it means it's mining solo.
            this._from_pool = false;
        }

        if ( !Buffer.isBuffer(this.block) ){

            // solo mining
            this.block = Buffer.concat([
                Serialization.serializeBufferRemovingLeadingZeros(Serialization.serializeNumber4Bytes(this.block.height)),
                Serialization.serializeBufferRemovingLeadingZeros(this.block.difficultyTargetPrev),
                this.block.computedBlockPrefix,
            ]) ;

        }

        // resets
        this._finished = false;
        this._final_batch = false;

        this.ibb.bestHash = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex");
        this.ibb.bestHashNonce = 0;

        await this._initiateWorkers();

        this._loop(loop_delay);
    }

    _maxWorkersDefault() {
        return Math.floor(OS.cpus().length / 2);
    }

    async _initiateWorkers() {

        let count = this.workers_max;

        if ( consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" )
            count = 1;

        for (let index = this.workers_list.length ; index < count; index++)
            await this._initializeWorker(index);


        return this;
    }

    async _initializeWorker(index){

        if (this.workers_list[index] && typeof this.workers_list[index].kill === "function")
            this.workers_list[index].kill('SIGINT');

        await this._createWorker(index);
    }

    async _createWorker(index) {
        // { execArgv: [`--max_old_space_size=${Math.floor(os.totalmem()/1024/1024)}`] }

        let worker;
        if (consts.TERMINAL_WORKERS.TYPE === "cpu") {
            worker = fork(
                this._worker_path, {}, {silent: this._silent}
            );
            Log.info("CPU worker created", Log.LOG_TYPE.defaultLogger );
        } else
        if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp") {

            worker = new ProcessWorkerCPP( index,  this.worker_batch, this.workers_max );
            worker.start(this._worker_path);

            Log.info("CPU CPP worker created", Log.LOG_TYPE.defaultLogger );

        } else if (consts.TERMINAL_WORKERS.TYPE === "gpu") {

            worker = new GPUWorker( index );
            worker.start(this._worker_path);

            Log.info("GPU worker created", Log.LOG_TYPE.defaultLogger );

        }

        worker._is_batching = false;

        worker.on('message', async (msg) => {

            // if (this.ibb._hashesPerSecond === 0)
            //     console.info(msg.type);

            worker.date = new Date().getTime();

            // hashing: hashed one time, so we are incrementing hashes per second
            if (msg.type === 'h') {
                this.ibb._hashesPerSecond += 3;

                return false;
            }

            // solved: stop and resolve but with a solution
            if (msg.type === 's') {

                this._finished = true;

                if (msg.h !== undefined)
                    this.ibb._hashesPerSecond += parseInt( msg.h );

                let hash;

                if (msg.hash.length === 64)
                    hash = Buffer.from(msg.hash, "hex");
                else
                    hash = new Buffer(msg.hash);

                this.ibb._workerResolve({
                    result: true,
                    nonce: parseInt(msg.nonce),
                    hash: new Buffer(hash),
                });

                // console.log("sol",new Buffer(msg.hash).toString("hex"));

                return false;
            }

            // batching: finished a batch of nonces
            if (msg.type === 'b') {

                worker._is_batching = false;

                if (msg.h !== undefined)
                    this.ibb._hashesPerSecond += parseInt( msg.h );

                let bestHash;

                if (msg.bestHash.length === 64)
                    bestHash = Buffer.from(msg.bestHash, "hex");
                else
                    bestHash = new Buffer(msg.bestHash);

                let change = false;
                for (let i = 0, l = this.ibb.bestHash.length; i < l; i++)
                    if (bestHash[i] < this.ibb.bestHash[i]) {
                        change = true;
                        break;
                    }
                    else if (bestHash[i] > this.ibb.bestHash[i])
                        break;

                if ( change ) {
                    this.ibb.bestHash = bestHash;
                    this.ibb.bestHashNonce = parseInt(msg.bestNonce)
                }


                // keep track of the ones that are working
                this._working--;

                // if none of the threads are working and we finished the range, then we should stop and resolve
                if (!this._working && this._current >= this._current_max)
                    this._stopAndResolve();

                if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" || consts.TERMINAL_WORKERS.TYPE === "gpu") {
                    //validate hash
                    let nonceBuffer = new Buffer([msg.bestNonce >> 24 & 0xff, msg.bestNonce >> 16 & 0xff, msg.bestNonce >> 8 & 0xff, msg.bestNonce & 0xff]);
                    let block = Buffer.concat([this.block, nonceBuffer]);

                    let hash = await Argon2.hash(block);
                    if (false === hash.equals(bestHash))
                        console.error("HASH MAY BE TO OLD!!!");
                    else
                        console.info("HASH is OK!!!");
                }


                return false;
            }
        });

        worker.date = new Date().getTime();

        this.workers_list[index] = worker;

        return this;
    }

    _stopAndResolve() {

        this._finished = true;

        if (this._run_timeout) {
            clearTimeout(this._run_timeout);
        }

        this.ibb._workerResolve({
            result: false,
            hash: this.ibb.bestHash,
            nonce: this.ibb.bestHashNonce
        });

        return this;
    }

    async _loop(_delay) {

        const ibb_halt = !this.ibb.started || this.ibb.resetForced || (this.ibb.reset && this.ibb.useResetConsensus);

        if (ibb_halt) {

            if (!this._finished)
                this._stopAndResolve();

            return false;
        }

        this.workers_list.forEach( async (worker, index) => {

            if (this._finished)
                return false;

            if (worker._is_batching)
                return false;

            if (this._final_batch)
                return false;

            worker._is_batching = true;

            // add only the rest
            if (this._current_max - this._current < this.worker_batch)
                this._final_batch = this._current_max - this._current;

            // keep track of the ones that are working
            this._working++;

            let batch  = this._final_batch ? this._final_batch : this.worker_batch;

            if (consts.TERMINAL_WORKERS.TYPE === "cpu") {
                worker.send({
                    command: 'start',
                    data: {
                        block: this.block,
                        difficulty: this.difficulty,
                        start: this._current,
                        batch: batch,
                    }
                });
            } else if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" || consts.TERMINAL_WORKERS.TYPE === "gpu") {
                if ( false === await worker.send( this.block.length, this.block, this.difficulty, this._current, this._current+batch, this.worker_batch_thread ))
                return false;
            }

            worker.date = new Date().getTime();

            this._current += this.worker_batch;

        });

        // healthy loop delay
        this._run_timeout = setTimeout( this._loop.bind(this) , _delay);

        return this;
    }
}

export default Workers;
