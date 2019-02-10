import consts from 'consts/const_global'

import DownloadHelper from "./Download-Helper";

class DownloadManager{

    constructor(){

        this.array = [];

    }

    async downloadFile(address, timeout){

        for (let key in this.array)
            if ( key === address){
                return this.array[key];
            }

        let answer = await DownloadHelper.downloadFile(address, timeout);
        this.array[address] = answer;

    }

}

export default new DownloadManager();