const uuid = require('uuid');

class SemaphoreProcessing{

    constructor(){

        this._list = [];

    }

    /**
     * Multiple Forks and Mining are asynchronously, and they can happen in the same time, changing the this.blocks
     * @param callback
     * @returns {Promise.<void>}
     */

    _deleteSemaphore(uuid){

        let index = -1;
        for (let i=0; i<this._list.length; i++)
            if (this._list[i].uuid === uuid) {
                index = i;
                break;
            }

        this._list.splice(index, 1);

    }

    async processSempahoreCallback( callback ){

        let id = uuid.v4();
        let resolver;

        let promise = new Promise ( async (resolve) => {
            resolver = resolve;
        });

        this._list.push({uuid: id, callback: callback, resolver: resolver, promise: promise});

        let index = -1;
        for (let i=0; i<this._list.length; i++)
            if (this._list[i].uuid === id) {
                index = i;
                break;
            }

        if (index === -1)
            console.error("STRANGE!!!! uuid was not found");

        if (index > 0) {

            try {

                await this._list[ index - 1 ].promise;

            } catch (exception) {

            }

            await this.sleep(70);
        }

        let answer;

        try {

            answer = await callback();
            await this.sleep(70);

        } catch (ex){
            console.error("error processingSemaphoreList callback !!!!!!!!!!!!!!!!!!!!!!!!", ex);
        }

        this._deleteSemaphore(id);

        try {

            return answer;

        } catch (ex){
            console.error("error processingSemaphoreList RESOLVER !!!!!!!!!!!!!!!!!!!!!!!!", ex);
            return false;
        }

    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

export default SemaphoreProcessing;