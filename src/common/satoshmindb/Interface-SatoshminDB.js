/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */
/* Edited by Cosmin-Dumitru Oprea */

var toBuffer = require('blob-to-buffer')

let SatoshminDB = require('pouchdb');
let atob = require('atob');
let btoa = require('btoa');

 
if (typeof window === "undefined")
    SatoshminDB = require('pouchdb-node');

class InterfacePouchDB {

    constructor(databaseName = "defaultDB") {
        this.dbName = databaseName;
        this.db = new SatoshminDB(this.dbName);
        this.attachName = 'wallet.bin';
    }

    async createDocument(key, value) {

        this.deleteDocumentAttachmentIfExist(key);

        try {
            let response = await this.db.put({_id: key, value: value});

            return true;
        } catch (err){
            if (err.status === 409)
                return this.updateDocument(key, value)
            else {
                console.log("createDocument raised exception", key, err);
                throw err;
            }
        }

    }

    async updateDocument(key, value) {

        try{
            let doc = await this.db.get(key);

            let response = await this.db.put({
                _id: doc._id,
                _rev: doc._rev,
                value: value
            });

            return true;
        } catch (exception){
            console.log("updateDocument error", exception)
            throw err;
        }

    }

    async getDocument(key) {

        try{
            let response = await this.db.get(key, {attachments: true});

                if (response._attachments === undefined) {
                    return response.value;
                } else {
                    //get attachment
                    return new Buffer(atob(response._attachments.key.data).toString('hex'), 'hex');
                }
        } catch (Exception){
            console.log("error getDocument ", Exception);
            return Exception;
        }

    }

    async deleteDocument(key) {

        try {
            let doc = await this.db.get(key, {attachments: true})

            let response = await this.db.remove(doc._id, doc._rev)

            return true;

        } catch (err){
            console.log("deleteDocument raised an error", key);
            return err;
        }

    }

    async saveDocumentAttachment(key, value) {

        let attachment = value;
        // we need blob in browser
        if (typeof window !== "undefined" && Buffer.isBuffer(value)) {
            attachment = new Blob([value.toString('hex')]); 
        } else { //we are in node
            attachment = new Buffer(value.toString('hex'));
        }

        try {
            let result = await this.db.put({
                _id: key,
                _attachments: {
                    key: {
                        content_type: 'application/octet-binary',
                        data: attachment
                    }
                }
            });

            return true;

        } catch (err){

            if (err.status === 409) {
                return await this.updateDocumentAttachment(key, attachment);
            } else {
                if (err.status === 404) {

                    //if document not exist, create it and recall attachment
                    try {
                        let response = this.createDocument(key, null);

                        return await this.saveDocumentAttachment(key, value);
                    } catch (exception){

                        console.log('saveDocumentAttachment raised an error', exception);
                    }

                } else {
                    console.log('saveDocumentAttachment 222 raised an error', err);
                    throw err;
                }
            }

        }

    }

    async updateDocumentAttachment(key, value) {

        try {
            let doc = await this.db.get(key, {attachments: true});

            try {
                let reuslt = await this.db.put({
                    _id: doc._id,
                    _attachments: {
                        key: {
                            content_type: 'application/octet-binary',
                            data: value
                        }
                    },
                    _rev: doc._rev
                });
                return true;
            } catch (err) {
                console.log("error updateDocumentAttachment1", err);
                throw err;
            }


        } catch (err){
            console.log("error updateDocumentAttachment2", err);
            throw err;
        }
    }

    async deleteDocumentAttachment(key) {
        try {
            let doc = await this.db.get(key);

            let result = await this.db.removeAttachment(doc._id, this.attachName, doc._rev);

            return true;

        } catch (exception){
           throw err;
        }
    }

    async deleteDocumentAttachmentIfExist(key) {

        try{
            let value = await this.getDocument(key);
            return this.deleteDocumentAttachment(key);
        } catch (err){
            console.log("deleteDocumentAttachmentIfExist raised an error", err);
            return false;
        }
    }


    //main methods
    save(key, value) {
        if (Buffer.isBuffer(value)) {
            return this.saveDocumentAttachment(key, value);
        } else {
            return this.createDocument(key, value);
        }
    }
    
    get(key) {
        return this.getDocument(key);
    }

    remove(key) {
        return this.deleteDocument(key);
    }

}

module.exports = InterfacePouchDB;