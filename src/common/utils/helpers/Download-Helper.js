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

            if ( data ) return data;

        }
        catch(exception){

            if (consts.DEBUG)
                console.error("DownloadHelper::downloadFile ERROR downloading list: ", address );

        }

        return null;
    }

    async downloadMultipleFiles(addresses, timeout = 5000){

        if (!Array.isArray(addresses))
            addresses = [addresses];

        return new Promise(async (resolve) =>{

            let list = [];

            for (let i=0; i<addresses.length; i++) {

                let answer = await this.downloadFile(addresses[i], timeout);
                if (answer)
                    list.push(answer);

            }

            if (list.length === 0) return resolve() ;
            return resolve(list);

        })

    }

}

export default new DownloadHelper();
