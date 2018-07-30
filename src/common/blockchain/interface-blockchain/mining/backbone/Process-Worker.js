var exec = require('child_process').exec;
var fs = require('fs');

import consts from "consts/const_global"
const uuid = require('uuid');

const EventEmitter = require('events');
import Blockchain from "main-blockchain/Blockchain"

import Log from 'common/utils/logging/Log';

class ProcessWorker{

    constructor(id, noncesWorkBatch){

        this.id = id||0;
        this.noncesWorkBatch = noncesWorkBatch;

        this._filename = './dist_bundle/CPU/input.txt';

        this.suffix = this.id;

        this._child = undefined;

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this._is_batching = false;
        this._path = '';

        this._timeoutValidation = setTimeout( this._validateWork.bind(this), 20);
    }

    _getProcessParams(){

        return this._path+ ' -b '+ this.noncesWorkBatch + ' -f ' + this._filename + this.suffix;

    }

    async start(path){

        if (path !== undefined)
            this._path = path;

        var isWin = /^win/.test(process.platform);

        try {
            await fs.unlinkSync(this._filename + this.suffix + "output");
        } catch (exception){

        }

        this._child = exec( (isWin ? 'cmd' : '')  + ' '+this._getProcessParams(), async (e, stdout, stderr) => {

            //console.log(stdout);
            console.log(stderr);

            if (e) {
                console.error("C/C++ CPU Miner Raised an error", e);

                await this.start(path);
                this._is_batching = true;
            }

        });

        this._child.stdout.on('data', (data) => {

        });

        this._child.on('close', () => {
            console.log('done');
            console.info();
        });

        this._prevHash = '';

        await Blockchain.blockchain.sleep(5000);

    }



    async send(length, block, difficulty, start, end, batch){

        //this._child.send(data);

        let data = '';
        data += start + ' ';
        data += length +' ';

        for (let i=0; i<block.length; i++)
            data += block[i]+ '  ';

        for (let i=0; i<difficulty.length; i++)
            data += difficulty[i]+ ' ';

        data += end + ' ';
        data += batch + ' ';
        data += 218391 + '';

        this._timeStart = new Date().getTime();
        this._count = end - start;

        this._sendDataTimeout = setTimeout( this._writeWork.bind(this, data), 10 );

    }

    async _writeWork(data){

        try {
            await fs.writeFileSync( this._filename + this.suffix, data, "binary");
        } catch (exception){
            console.error("Error sending the data to GPU", exception);
            this._sendDataTimeout = setTimeout( this._writeWork.bind(this,data), 10 );
        }

    }


    async _validateWork(){

        let data;

        try {
            data = await fs.readFileSync( this._filename+ this.suffix + 'output');
        } catch (exception){
            this._timeoutValidation = setTimeout( this._validateWork.bind(this), 10);
            return;
        }

        try {

            data = JSON.parse(data);

            let hash;
            if (data.bestHash !== undefined) hash = data.bestHash;
            else hash = data.hash;

            if (hash !== this._prevHash) {

                console.info(data);

                if ( data.type === "b" || data.type === "s")
                    data.h = Math.floor(this._count / (new Date().getTime() - this._timeStart) * 1000);

                this._emit("message", data);

                this._prevHash = hash;

            }
        } catch (exception){

        }

        this._timeoutValidation = setTimeout( this._validateWork.bind(this), 10);
    }


    _emit(a,b){
        return this.emitter.emit(a,b)
    }

    on(a,b){
        return this.emitter.on(a,b);
    }

    once(a,b){
        return this.emitter.once(a,b);
    }

    get connected(){
        return true;
    }

}

export default ProcessWorker