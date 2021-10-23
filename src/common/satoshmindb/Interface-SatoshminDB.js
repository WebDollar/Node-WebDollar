/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */
/* Edited by Cosmin-Dumitru Oprea */

import consts from 'consts/const_global'

import StatusEvents from "common/events/Status-Events";
let pounchdb = (process.env.BROWSER) ? (require('pouchdb-browser').default) : (require('pouchdb-node'));

class InterfaceSatoshminDB {

    constructor(databaseName = consts.DATABASE_NAMES.DEFAULT_DATABASE) {

        this._dbName = databaseName;

        this._start();
    }

    _start(){
        try {
            this.db = new pounchdb(this._dbName, {revs_limit: 1, auto_compaction: true});
        } catch (exception){
            console.error("InterfaceSatoshminDB exception", pounchdb);
        }
    }


    async _deleteDocument(key) {

        try {

            let doc = await this.db.get(key, {attachments: true} );
            if (!doc) return false;

            let rev = doc._rev
            doc = null

            let response = await this.db.remove( key, rev );
            return response && response.ok;

        } catch (err) {

            if (err.status === 404) //NOT FOUND
                return true;

            if (err.status === 500)
                StatusEvents.emit("blockchain/logs", {message: "IndexedDB Error", reason: exception.reason.toString() });

            //console.error("_deleteDocument raised an error ", key, err);
            return false;

        }

    }

    async _getDocument(key) {

        try {
            let response = await this.db.get(key, {attachments: true});

            if (!response ) return null;
            if ( !response._attachments ) return response.value;
            if ( response._attachments.key ) return Buffer.from( Buffer.from( response._attachments.key.data, 'base64').toString(), "hex");  //get attachment
            return Buffer.from( response._attachments.myBlob.data )  //get attachment

        } catch (err) {

            if (err.status === 404) //NOT FOUND
                return null;

            console.error("error _getDocument ", err);
            throw err;
        }

    }

    async _saveDocument(key, value ) {

        let _rev, force

        try{
            let response = await this.db.get(key, {attachments: true});
            if (response){
                _rev = response._rev
                force = true

                response = null
            }
        }catch(err){

        }

        let result

        if (Buffer.isBuffer(value)){

            if (process.env.BROWSER)
                value = new Blob([value] );

            result = await this.db.put({
                _id: key,
                _attachments: {
                    myBlob: {
                        content_type: 'text/plain',
                        data: value
                    }
                },
                _rev,
                force,
            });

        }else {

            result = await this.db.put({
                _id: key,
                value,
                _rev,
                force,
            });

        }

        return result && result.ok;

    }

    //main methods
    _save(key, value) {

        return new Promise(async (resolve)=>{

            try {

                resolve(await this._saveDocument(key, value));

            } catch (exception) {
                console.error("db.save error " + key, exception);

                if (Math.random() < 0.1) console.error(key, value);

                if (exception.status === 500)
                    StatusEvents.emit("blockchain/logs", {message: "IndexedDB Error", reason: exception.reason.toString() });

                resolve(null);
            }

        })
    }

    async save( key, value, timeout, trials = 10){

        let out = await this._save(key, value, timeout);
        if (out)
            return out;

        return null;
    }

    _get(key, timeout){

        return new Promise( resolve => {


            this._getDocument(key).then( answer =>{

                resolve({result: answer } );

            }).catch(exception => {

                console.error("db.get error " + key, exception);

                StatusEvents.emit("blockchain/logs", { message: "IndexedDB Error", reason: exception.reason.toString() });

                resolve(null);

            });

        })

    }

    async get(key, timeout=7000, trials = 20) {

        //if ( !trials ) trials = 1;

        let out = await this._get(key, timeout );
        if (out)
            return out.result;

        return null;
    }

    async remove(key, trials = 10) {

        let out = await this._deleteDocument(key);
        if (out)
            return out;

        return null;
    }

    close(){

        if (this.db)
            this.db.close();

    }

}

export default InterfaceSatoshminDB;
