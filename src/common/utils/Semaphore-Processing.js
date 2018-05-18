
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
                await this.sleep(70);
            }

            let answer;

            try {
                answer = await callback();
                await this.sleep(70);
            } catch (ex){
                console.error("error processingSemaphoreList callback !!!!!!!!!!!!!!!!!!!!!!!!", ex);
                resolve(false);
                return;
            }


            try {
                resolve(answer);
                await this.sleep(70);
            } catch (ex){
                console.error("error processingSemaphoreList RESOLVER !!!!!!!!!!!!!!!!!!!!!!!!", ex);
                resolve(false)
                return;
            }

            this._list.splice(index, 1);

        });

        this._list.push({callback: callback, resolver: resolver, promise: promise});
        index = this._list.length-1;

        return promise;

    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

export default SemaphoreProcessing;