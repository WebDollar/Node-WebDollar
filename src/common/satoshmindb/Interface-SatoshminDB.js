/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */
/* Edited by Cosmin-Dumitru Oprea */

var toBuffer = require('blob-to-buffer');
const colors = require('colors/safe');

let SatoshminDB = require('pouchdb');
let atob = require('atob');
let btoa = require('btoa');
const MainBlockchain = require('main-blockchain/Blockchain');

if (typeof window === "undefined")
    SatoshminDB = require('pouchdb-node');

class InterfacePouchDB {

    constructor(databaseName = "defaultDB") {
        this.dbName = databaseName;
        this.db = new SatoshminDB(this.dbName);
        this.attachName = 'wallet.bin';
    }

    async createDocument(key, value) {

        await this.deleteDocumentAttachmentIfExist(key);

        try {
            let response = await this.db.put({_id: key, value: value});

            return true;
        } catch (err) {
            if (err.status === 409)
                return await this.updateDocument(key, value)
            else {
                console.log("createDocument raised exception", key, err);
                throw err;
            }
        }

    }

    async updateDocument(key, value) {

        try {
            let doc = await this.db.get(key);

            let response = await this.db.put({
                _id: doc._id,
                _rev: doc._rev,
                value: value
            });

            return true;
        } catch (exception) {
            console.log("updateDocument error" + key, exception)
            throw exception;
        }

    }

    async getDocument(key) {

        try {
            let response = await this.db.get(key, {attachments: true});

            if (response._attachments === undefined) {
                return response.value;
            } else {
                //get attachment
                return new Buffer(atob(response._attachments.key.data).toString('hex'), 'hex');
            }

        } catch (Exception) {

            if (Exception.status === 404) return null; //nothing
            else {
                console.log("error getDocument ", Exception);
                throw Exception;
            }
        }

    }

    async deleteDocument(key) {

        try {
            let doc = await this.db.get(key, {attachments: true})

            let response = await this.db.remove(doc._id, doc._rev)

            return true;

        } catch (err) {
            if (err.status === 404) return null; // not existing
            else {
                console.log("deleteDocument raised an error ", key);
                return err;
            }
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

        } catch (err) {

            if (err.status === 409) {
                return await this.updateDocumentAttachment(key, attachment);
            } else {
                if (err.status === 404) {

                    //if document not exist, create it and recall attachment
                    try {
                        let response = this.createDocument(key, null);

                        return await this.saveDocumentAttachment(key, value);
                    } catch (exception) {

                        console.log('saveDocumentAttachment raised an error for key ' + key, exception);
                    }

                } else {
                    console.log('saveDocumentAttachment 222 raised an error for key ' + key, err);
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
                console.log("error updateDocumentAttachment1 " + key, err);
                throw err;
            }


        } catch (err) {
            console.log("error updateDocumentAttachment2  " + key, err);
            throw err;
        }
    }

    async deleteDocumentAttachment(key) {
        try {
            let doc = await this.db.get(key);

            let result = await this.db.removeAttachment(doc._id, this.attachName, doc._rev);

            return true;

        } catch (exception) {
            return false;
            throw exception;
        }
    }

    async deleteDocumentAttachmentIfExist(key) {

        try {
            let value = await this.getDocument(key);
            return await this.deleteDocumentAttachment(key);
        } catch (err) {
            console.log("deleteDocumentAttachmentIfExist raised an error", err);
            return false;
        }
    }


    //main methods
    async save(key, value) {
        try {
            if (Buffer.isBuffer(value)) {
                return await this.saveDocumentAttachment(key, value);
            } else {
                return await this.createDocument(key, value);
            }
        } catch (exception) {
            console.log("db.save error " + key, exception);
            if (exception.status === 500)
                MainBlockchain.emitter.emit("blockchain/logs", {message: "IndexedDB Errror"});
            return null;
        }
    }

    get(key, timeout=10000) {

        return new Promise((resolve)=>{

            //timeout, max 10 seconds to load the database
            let timeoutInterval = setTimeout(()=>{
                console.log(colors.red("get failed !!" + key));
                resolve(null);
            }, timeout);

            this.getDocument(key).then((answer)=>{

                clearTimeout(timeoutInterval);
                resolve(answer);

            }).catch((exception)=>{

                clearTimeout(timeoutInterval);
                console.log(colors.red("db.get error " + key), exception);

                if (exception.status === 500)
                    MainBlockchain.emitter.emit("blockchain/logs", {message: "IndexedDB Error"});

                resolve(null);
            });

        })


    }

    async remove(key) {
        try {
            let result = await this.deleteDocument(key);
            return result;
        } catch (exception) {
            console.log("db.remove error " + key, exception);
            if (exception.status === 500)
                MainBlockchain.emitter.emit("blockchain/logs", {message: "IndexedDB Error"});
            return null;
        }
    }

}

module.exports = InterfacePouchDB;