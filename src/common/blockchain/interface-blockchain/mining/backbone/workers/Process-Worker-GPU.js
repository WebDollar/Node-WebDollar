/**
 * Argon2d is GPU unfriendly, it means, it will be more profitable to mine using CPU than GPU due the fact that Argon2d is memory intensive and important is the speed of the memory.
 *
 * Argon2d GPU supports CUDA and NVIDIA. It requires to install the NVIDIA drivers, CUDA software and after that you could use it with the CUDA cores.
 *                                                                                  opencl is not efficient from the initial tests
 *
 */

import consts from "consts/const_global"
const uuid = require('uuid');

import ProcessWorker from "./Process-Worker"

class ProcessWorkerGPU extends ProcessWorker {

    constructor(gpuID, noncesWorkBatch){

        super(gpuID, noncesWorkBatch);

        let gpuInstance;

        gpuInstance = gpuID % consts.TERMINAL_WORKERS.GPU_INSTANCES;
        gpuID = Math.floor( gpuID / consts.TERMINAL_WORKERS.GPU_INSTANCES);

        this.gpuID = gpuID||0;
        this.gpuInstance = gpuInstance || 0;

        this.suffix = this.gpuID+"_"+this.gpuInstance;

    }

    _getProcessParams(){

        return ' '+this._path+ ' -m '+consts.TERMINAL_WORKERS.GPU_MODE+ ' -b '+ this.noncesWorkBatch + ' -d '+this.gpuID+ ' -r socket -f '+'./dist_bundle/GPU/input.txt'+this.suffix;

    }



}

export default ProcessWorkerGPU