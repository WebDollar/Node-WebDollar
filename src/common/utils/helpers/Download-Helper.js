const axios = require('axios');
import consts from 'consts/const_global'

class DownloadHelper{

    async post (request, data, timeout = 20000 ){

        try{

            let axiosInstance = axios.create({
                timeout: timeout,
                responseType: 'json',
            });

            return await axiosInstance.post( request, data );

        } catch (exception){
            return null;
        }

    }

    async downloadFile(address, timeout){

        try{
            let axiosInstance = axios.create({
                timeout: timeout,
                responseType: 'json',
            });

            let response = await axiosInstance.get(address);
            if (response === null) return null;

            let data = response.data;

            if (typeof data === 'string'){
                try {
                    data = JSON.parse(data);
                } catch (exception){

                    if (consts.DEBUG)
                        console.error("Error processing downloadFile data", data, exception);

                    return null;
                }
            }

            if (typeof data === 'object') return data;

            return null;
        }
        catch(exception){

            if (consts.DEBUG)
                console.error("ERROR downloading list: ", address );

            return null;
        }
    }

    async downloadMultipleFiles(addresses, timeout){

        if (!Array.isArray(addresses))
            addresses = [addresses];

        return new Promise((resolve)=>{

            let timeoutId = setTimeout(()=>{

                if (resolve !== undefined) {
                    let callback = resolve;
                    resolve = undefined;
                    callback(null);
                }

            }, timeout + 1000);

            for (let i=0; i<addresses.length; i++){

                this.downloadFile(addresses[i], timeout ).then((answer)=>{

                    if (answer !== null && resolve !== undefined){

                        clearTimeout(timeoutId);

                        let callback = resolve;
                        resolve = undefined;
                        callback(answer);

                    }

                })

            }

        })

    }

}

export default new DownloadHelper();