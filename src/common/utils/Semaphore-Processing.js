const colors = require('colors/safe');

class SemaphoreProcessing{

    constructor(processingSemaphoreInterval = 50){

        this._list = [];

        this.processingSemaphoreInterval = processingSemaphoreInterval;

        setTimeout(this._processingSemaphoreList.bind(this), this.processingSemaphoreInterval);

    }

    /**
     * Multiple Forks and Mining are asynchronously, and they can happen in the same time, changing the this.blocks
     * @param callback
     * @returns {Promise.<void>}
     */

    processSempahoreCallback(callback){

        return new Promise ((resolve) =>{
            this._list .push({callback: callback, resolver: resolve});
        });

    }


    async _processingSemaphoreList(){

        if (this._list.length > 0){

            let answer = false;
            try {
                answer = await this._list[0].callback();
            } catch (ex){
                console.error("error processingSemaphoreList !!!!!!!!!!!!!!!!!!!!!!!!", ex);
            }

            try {
                let resolver = this._list[0].resolver;
                this._list.splice(0, 1);

                resolver(answer);

            } catch (ex){
                console.error("error processingSemaphoreList RESOLVER !!!!!!!!!!!!!!!!!!!!!!!!", ex);
            }

        }

        setTimeout( async ()=>{ await this._processingSemaphoreList.bind(this)}, this.processingSemaphoreInterval);

    }

}

export default SemaphoreProcessing;