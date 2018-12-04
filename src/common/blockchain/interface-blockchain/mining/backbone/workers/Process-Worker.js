var exec = require('child_process').exec;
var fs = require('fs');

import consts from "consts/const_global"
const uuid = require('uuid');
import  Utils from "common/utils/helpers/Utils"

const EventEmitter = require('events');
import Blockchain from "main-blockchain/Blockchain"

import Log from 'common/utils/logging/Log';

class ProcessWorker{

    constructor(id, noncesWorkBatch, allowSendBeforeReadPreviously=true){


        this.id = id||0;
        this.noncesWorkBatch = noncesWorkBatch;
        this.allowSendBeforeReadPreviously = allowSendBeforeReadPreviously;

        this._outputFilename = 'input.txt';

        this.suffix = this.id;

        this._child = undefined;

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this._is_batching = false;
        this._path = '';

        this._start = 0;
        this._end = -1;
        this._data = undefined;

        this._lastData = undefined;
        this._nextData = undefined;

    }

    _getProcessParams(){

        return this._path+ ' -b '+ this.noncesWorkBatch + ' -f ' + this._outputFilename + this.suffix;

    }

    restartWorker(){
        this._is_batching = false;
    }

    async start(path, filename) {


        if (path !== undefined) {
            this._path = path + filename;
            this._outputFilename = path + this._outputFilename;
        }

        try {

            await this._deleteFile();
            await this._deleteFile("output");

        } catch (exception) {

        }

        this._child = exec(( Utils.isWin ? '' : '') + ' ' + this._getProcessParams(), async (e, stdout, stderr) => {

            //console.log(stdout);
            console.log(stderr);

            if (e) {
                console.error("Process Raised an error", e);

                // await this.start(path);
                // this._is_batching = true;

            }

        });

        await Blockchain.blockchain.sleep(1000);

        if (this._child.exitCode !== null)
            return false;

        this._child.stdout.on('data', (data) => {

        });

        this._child.on('close', () => {
            console.log('done');
            console.info();
        });

        this._prevHash = '';

        await Blockchain.blockchain.sleep(1000);

        if (this._timeoutValidation === undefined)
            this._timeoutValidation = setTimeout(this._validateWork.bind(this), 1000);

        // if (this._sendDataTimeout === undefined)
        //     this._sendDataTimeout = setTimeout(this._writeWork.bind(this), 10);

        return true;
    }

    kill(param){

        clearTimeout(this._timeoutValidation);
        this._child.kill(param);

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

        this._start = start;
        this._end = end;
        this._data = data;

        //console.log("SENDING ", start, end);

        let sendMessage = 0;

        if (this._lastData === undefined )
            this._sendDataTimeout = setTimeout( this._writeWork.bind(this, data), 10 );
        else
            this._nextData = this._lastData;

    }


    async _writeWork(data){

        try {

            await fs.writeFileSync( this._outputFilename + this.suffix, data, "binary");
        } catch (exception){
            console.error("Error sending the data to GPU", exception);
            this._sendDataTimeout = setTimeout( this._writeWork.bind(this,data), 10 );
        }

    }



    async _deleteFile(prefix = ''){

        if (false === await fs.existsSync(this._outputFilename + this.suffix + prefix ))
            return;

        try {
            await fs.unlinkSync(this._outputFilename + this.suffix + prefix );
        } catch (exception){
        }

    }

    // async _writeWork(){
    //
    //     if (this._data !== undefined)
    //         try {
    //
    //             await this._deleteFile();
    //
    //             await fs.writeFileSync( this._outputFilename + this.suffix, this._data, "binary");
    //             this._data = undefined;
    //
    //         } catch (exception){
    //             console.error("Error sending the data to GPU", exception);
    //         }
    //     this._sendDataTimeout = setTimeout( this._writeWork.bind(this), 10 );
    //
    // }


    async _validateWork(){

        let data;

        try {
            data = await fs.readFileSync( this._outputFilename + this.suffix + 'output');
        } catch (exception){
            this._timeoutValidation = setTimeout( this._validateWork.bind(this), 10);
            return;
        }

        try {

            data = JSON.parse(data);

            let hash;
            if (data.bestHash !== undefined) hash = data.bestHash;
            else hash = data.hash;

            let nonce;
            if (data.bestNonce !== undefined) nonce = data.bestNonce;
            else nonce = data.nonce;

            if (hash !== this._prevHash) {

                console.info(data);

                if ( data.type === "b" || data.type === "s")
                    data.h = this._count;

                this._emit("message", data);

                this._prevHash = hash;

                if (this._nextData !== undefined) {
                    this._sendDataTimeout = setTimeout(this._writeWork.bind(this, this._nextData), 10);
                    this._nextData = undefined;
                }
                else {
                    this._lastData = undefined;
                }

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