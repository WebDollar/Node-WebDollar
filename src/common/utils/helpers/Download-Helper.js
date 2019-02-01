/* eslint-disable */

var rp = require('request-promise');

import consts from 'consts/const_global';

class DownloadHelper{

    async downloadFile(address, timeout = 10000 ){

        try{

            // Socket IO reports local Ip`s prefixed with ::ffff:
            address = address.replace('::ffff:', '');

            let data = await rp({
                uri: address,
                headers: {
                    'User-Agent': 'Request-Promise'
                },
                json: true, // Automatically parses the JSON string in the response
                timeout: timeout
            });

            if (typeof data === 'object') return data;

            return null;
        }
        catch(exception){

            if (consts.DEBUG)
                console.error("DownloadHelper::downloadFile ERROR downloading list: ", address );

            return null;
        }
    }

    async downloadMultipleFiles(addresses, timeout = 5000){

        if (!Array.isArray(addresses))
            addresses = [addresses];

        return new Promise((resolve)=>{

            let timeoutId = setTimeout(()=>{

                if (resolve !== undefined) {
                    let callback = resolve;
                    resolve = undefined;
                    callback(null);
                }

            }, timeout + 1000 );

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
