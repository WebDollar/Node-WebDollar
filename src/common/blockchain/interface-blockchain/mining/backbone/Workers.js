// Contributor: Adelin

import Serialization from "common/utils/Serialization";
import Argon2 from 'common/crypto/Argon2/Argon2'
import Log from 'common/utils/logging/Log';
import Blockchain from "main-blockchain/Blockchain"

const FS = require('fs');
const OS = require('os');
const { fork } = require('child_process');
//const fkill = require('fkill');

import consts from 'consts/const_global'

import ProcessWorkerCPP from "./workers/Process-Worker-CPP";
import ProcessWorkerGPU from "./workers/Process-Worker-GPU";

class Workers {
    /**
     * @param {BlockchainBackboneMining} ibb
     *
     * @return {Workers}
     */
    constructor(ibb) {

        this.ibb = ibb;

        this._abs_end = 0xFFFFFFFF;

        this._from_pool = undefined;

        this.workers_list = [];

        // workers setup
        if (consts.TERMINAL_WORKERS.CPU_MAX === -100) { // NO POW MINING

        } else
        if (consts.TERMINAL_WORKERS.TYPE === "cpu") { // MULTI THREADING MINING

            this._worker_path = consts.TERMINAL_WORKERS.PATH;
            this._worker_path_file_name = '';

            this.workers_max = consts.TERMINAL_WORKERS.CPU_MAX || this._maxWorkersDefault() || 1;
            this.worker_batch = consts.TERMINAL_WORKERS.CPU_WORKER_NONCES_WORK || 500;
            this.worker_batch_thread = this.worker_batch;

            this.ibb._intervalPerMinute = false;

        } else if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp") { //CPP MINER

            this._worker_path = consts.TERMINAL_WORKERS.PATH_CPP;
            this._worker_path_file_name = consts.TERMINAL_WORKERS.PATH_CPP_FILENAME;

            this.workers_max = consts.TERMINAL_WORKERS.CPU_MAX || this._maxWorkersDefault() || 1;
            this.worker_batch = consts.TERMINAL_WORKERS.CPU_CPP_WORKER_NONCES_WORK;
            this.worker_batch_thread = consts.TERMINAL_WORKERS.CPU_CPP_WORKER_NONCES_WORK_BATCH || 500;


            if (this.worker_batch === 0)
                this.worker_batch = 10 * this.worker_batch_thread*this.workers_max;

            this.ibb._intervalPerMinute = true;
        }
        else if (consts.TERMINAL_WORKERS.TYPE === "gpu") { //GPU MINING

            this._worker_path = consts.TERMINAL_WORKERS.PATH_GPU;
            this._worker_path_file_name = consts.TERMINAL_WORKERS.PATH_GPU_FILENAME;

            this.workers_max = (consts.TERMINAL_WORKERS.GPU_MAX * consts.TERMINAL_WORKERS.GPU_INSTANCES)||1;
            this.worker_batch = consts.TERMINAL_WORKERS.GPU_WORKER_NONCES_WORK;
            this.worker_batch_thread = consts.TERMINAL_WORKERS.GPU_WORKER_NONCES_WORK_BATCH;

            this.ibb._intervalPerMinute = true;
        } else {

            Log.error('NO WORKER SPECIFIED. Specify "cpu", "cpu-cpp", "gpu" ', Log.LOG_TYPE.default);

        }


        if (!FS.existsSync(this._worker_path + this._worker_path_file_name))
            Log.error('Worker build is missing.', Log.LOG_TYPE.default);

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


        if (!this.makeUnresponsiveThreadsTimeout)
            this.makeUnresponsiveThreadsTimeout = setTimeout( this._makeUnresponsiveThreads.bind(this), 5000 );

    }

    async _makeUnresponsiveThreads(){

        try {

            let date = new Date().getTime();

            if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" || consts.TERMINAL_WORKERS.TYPE === "gpu")
                for (let i = this.workers_list.length - 1; i >= 0; i--)
                    if ((date - this.workers_list[i].date ) > 60 * 1000) {

                        await this.workers_list[i].restartWorker();
                        this.workers_list[i].date = new Date().getTime();

                        // await this.workers_list[i].kill();
                        // this.workers_list.splice(i, 1);

                        Log.info("Restarting Worker", Log.LOG_TYPE.default);


                    }

            // if ( this._current >= this._current_max )
            //     this._stopAndResolve();
        } catch (exception){

        }

        this.makeUnresponsiveThreadsTimeout = setTimeout( this._makeUnresponsiveThreads.bind(this), 5000 );

    }

    haveSupport() {

        // disabled by miner
        if (consts.TERMINAL_WORKERS.TYPE === "cpu" ) {

            if (consts.TERMINAL_WORKERS.CPU_MAX === -1)
                return false;

            // it needs at least 2
            if (this.workers_max <= 1)
                return false;

        }
        return true;
    }

    stopMining(){

        try {

            console.log("Stop Mining!");

            for (let i = 0; i < this.workers_list.length; i++){
                if (this.workers_list[i] !== undefined && typeof this.workers_list[i].kill === "function")
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
        this.blockId = this.ibb.blockId || this.ibb.block.height;

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
                this.block._computeBlockHeaderPrefix(true),
            ]) ;

        }

        // resets8
        this._finished = false;
        this._final_batch = false;

        this.ibb.bestHash = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex");
        this.ibb.bestHashNonce = 0;

        await this._initiateWorkers();

        if (this._loopTimeout === undefined)
            this._loopTimeout = setTimeout( this._loop.bind(this, loop_delay), 1);
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
        let started = false;

        if (consts.TERMINAL_WORKERS.TYPE === "cpu") {
            worker = fork(
                this._worker_path, {}, {silent: this._silent}
            );
            Log.info("CPU worker created", Log.LOG_TYPE.defaultLogger );
            started = worker.connected;
        } else
        if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp") {

            worker = new ProcessWorkerCPP( index,  this.worker_batch, this.workers_max );
            started = await worker.start(this._worker_path , this._worker_path_file_name);

            Log.info("CPU CPP worker created", Log.LOG_TYPE.defaultLogger );

        } else if (consts.TERMINAL_WORKERS.TYPE === "gpu") {

            worker = new ProcessWorkerGPU( index,  this.worker_batch );
            started = await worker.start(this._worker_path, this._worker_path_file_name);

            Log.info("GPU worker created", Log.LOG_TYPE.defaultLogger );

        }

        worker.date = new Date().getTime();
        if ( !started ) {
            this.workers_list[index] = worker;
            return worker;
        }

        worker._is_batching = false;

        worker.on('message', async (msg) => {

            // if (this.ibb._hashesPerSecond === 0)
            //     console.info(msg.type);

            worker.date = new Date().getTime();

            // hashing: hashed one time, so we are incrementing hashes per second
            if (msg.type === 'h') {
                this.ibb._hashesPerSecond += 3;

                return true;
            }

            if (msg.type === 's' || msg.type === 'b'){
                //worker is batching now
                worker._is_batching = false;

                // keep track of the ones that are working
                this._working--;

                if ( msg.h )
                    this.ibb._hashesPerSecond += parseInt(msg.h);


            }

            // solved: stop and resolve but with a solution
            if (msg.type === 's') {

                this._finished = true;

                //the blockId is not matching
                if (msg.blockId && parseInt(msg.blockId) !== (this.ibb.blockId || this.ibb.block.height))
                    return false;

                let hash;

                if (msg.hash.length === 64) hash = Buffer.from(msg.hash, "hex");
                else hash = new Buffer(msg.hash);

                let nonce = parseInt(msg.nonce);

                if ( consts.DEBUG && !Blockchain.MinerPoolManagement.minerPoolStarted)
                    if (false === await this._validateHash( hash, nonce ))
                        return false;

                this._stopAndResolve(true, hash, nonce);

                // console.log("sol",new Buffer(msg.hash).toString("hex"));

                return true;
            }

            // batching: finished a batch of nonces
            if (msg.type === 'b') {

                //the blockId is not matching
                if (msg.blockId && parseInt(msg.blockId) !== (this.ibb.blockId || this.ibb.block.height))
                    return false;

                let bestHash;

                if (msg.bestHash.length === 64) bestHash = Buffer.from(msg.bestHash, "hex");
                else bestHash = new Buffer(msg.bestHash);

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


                // if none of the threads are working and we finished the range, then we should stop and resolve
                if (!this._working && this._current >= this._current_max)
                    this._stopAndResolve();

                if (consts.DEBUG)
                    await this._validateHash(bestHash, parseInt(msg.bestNonce));

                return true;
            }
        });

        worker.date = new Date().getTime();
        this.workers_list[index] = worker;
        return worker;
    }

    async _validateHash(initialHash, nonce){

        if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" || consts.TERMINAL_WORKERS.TYPE === "gpu") {
            //validate hash
            let nonceBuffer = new Buffer([nonce >> 24 & 0xff, nonce >> 16 & 0xff, nonce >> 8 & 0xff, nonce & 0xff]);
            let block = Buffer.concat([this.block, nonceBuffer]);

            let hash = await Argon2.hash(block);
            if (false === hash.equals(initialHash)) {
                Log.error("HASH may be too old", Log.LOG_TYPE.default );
                return false;
            } else {
                Log.warn("HASH is OK!", Log.LOG_TYPE.default );
            }
        }

        return true;
    }

    _stop(){

        this._finished = true;

        if (this._loopTimeout) {
            clearTimeout(this._loopTimeout);
            this._loopTimeout = undefined;
        }

    }

    _stopAndResolve( result = false, hash = undefined, nonce = undefined ) {

        this._stop();

        this.ibb._workerResolve({
            result: result,
            hash: hash || this.ibb.bestHash,
            nonce: nonce || this.ibb.bestHashNonce
        });

        return this;
    }

    async _loop(_delay = 1) {

        try {

            if (!this.ibb.started || this.ibb.resetForced || (this.ibb.reset && this.ibb.useResetConsensus)) {

                if (!this._finished)
                    this._stopAndResolve();

                return false;
            }


            await this.workers_list.forEach( async (worker, index) => {

                if (this._finished)
                    return false;

                if (worker._is_batching)
                    return false;

                if (this._final_batch) {

                    if (Blockchain.MinerPoolManagement && Blockchain.MinerPoolManagement.minerPoolStarted)
                        this.ibb.resetForced = true;

                    return false;
                }



                // add only the rest
                if (this._current_max - this._current < this.worker_batch)
                    this._final_batch = this._current_max - this._current;

                // keep track of the ones that are working
                this._working++;

                let batch  = this._final_batch ? this._final_batch : this.worker_batch;

                worker.date = new Date().getTime();

                this._current += this.worker_batch;
                worker._is_batching = true;

                if (consts.TERMINAL_WORKERS.TYPE === "cpu") {

                    worker.send({

                        command: 'start',
                        data: {
                            block: this.block,
                            difficulty: this.difficulty,
                            start: this._current,
                            batch: batch,
                            blockId: this.blockId,
                        }

                    });

                } else if (consts.TERMINAL_WORKERS.TYPE === "cpu-cpp" || consts.TERMINAL_WORKERS.TYPE === "gpu") {

                    if ( false === await worker.send ( this.block.length, this.block, this.difficulty, this._current, this._current + batch, this.worker_batch_thread ))
                        return false;

                }

            });


        } catch (exception){

            Log.error("_loop raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS )

        }

        // healthy loop delay
        this._loopTimeout = setTimeout( this._loop.bind( this, _delay ), _delay );

    }
}

export default Workers;
