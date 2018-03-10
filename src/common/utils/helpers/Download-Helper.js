const axios = require('axios');

class DownloadHelper{

    static async downloadFile(address, timeout){
        try{
            let axiosInstance = axios.create({
                timeout: timeout,
            });

            let response = await axiosInstance.get(address);
            if (response === null) return null;

            let data = response.data;

            if (typeof data === 'string'){
                try {
                    data = JSON.parse(data);
                } catch (exception){
                    console.error("Error processing downloadFile data", data, exception);
                }
            }

            if (typeof data === 'object') return data;

            return null;
        }
        catch(Exception){
            console.log("ERROR downloading list: ", address);
            console.log(Exception.toString());
            return null;
        }
    }

    static async downloadMultipleFiles(addresses, timeout){

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

                DownloadHelper.downloadFile(addresses[i], timeout ).then((answer)=>{

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

export default DownloadHelper