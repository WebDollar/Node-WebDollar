
class SemaphoreProcessing{

    constructor(){

        this._list = [];

    }

    /**
     * Multiple Forks and Mining are asynchronously, and they can happen in the same time, changing the this.blocks
     * @param callback
     * @returns {Promise.<void>}
     */

    processSempahoreCallback( callback ){

        let resolver = undefined, index;

        let promise = new Promise ( async (resolve) => {

            if (index > 0) {
                await this._list[index - 1].promise;
                this.sleep(100);
            }

            let answer;

            try {
                answer = await callback();
                this.sleep(100);
            } catch (ex){
                console.error("error processingSemaphoreList callback !!!!!!!!!!!!!!!!!!!!!!!!", ex);
            }


            try {
                resolve(answer);
                this.sleep(100);
            } catch (ex){
                console.error("error processingSemaphoreList RESOLVER !!!!!!!!!!!!!!!!!!!!!!!!", ex);
            }

            this._list.splice(index, 1);

        });

        this._list.push({callback: callback, resolver: resolver, promise: promise});
        index = this._list.length-1;

        return new promise;

    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

export default SemaphoreProcessing;