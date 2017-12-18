/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */
const PouchDB = require('pouchdb-node');

class InterfacePouchDB {

    constructor(databaseName) {
        this.dbName = (typeof databaseName !== 'undefined' && databaseName !== null ? databaseName : "defaultDB");
        this.db = new PouchDB(this.dbName);
        this.attachName = 'wallet.bin';
        this.isBrowser = this === window;
    }

    createDocument(key, value) {
        this.deleteAttachmentIfExist(key);

        return this.db.put({
            _id: key,
            value: value
        }).then((response) => {
            return response;
        }).catch((err) => {
            //document exists, update it
            if (err.status === 409) {
                return this.updateDocument(key, value)
            } else {
                throw err;
            }
        });
    }


    updateDocument(key, value) {
        return this.db.get(key).then((doc) => {
            return this.db.put({
                _id: doc._id,
                _rev: doc._rev,
                value: value
            });
        }).then((response) => {
            return response;
        }).catch((err) => {
            throw err;
        });
    }

    getDocument(key) {
        return this.db.get(key).then((doc) => {
            return doc.value;
        }).catch((err) => {
            console.log(err);
        });
    }

    deleteDocument(key) {
        return this.db.get(key).then((doc) => {
            return this.db.remove(doc._id, doc._rev);
        }).then((result) => {
            return result;
        }).catch((err) => {
            throw err;
        });
    }

    //attachments

    saveAttachment(key, value) {
        // this.deleteDocumentIfExist(key);

        let attachment = (this.isBrowser) ? new Blob(value, {content_type: 'application/octet-stream'}) : new Buffer(value, {content_type: 'application/octet-stream'});


        return this.db.putAttachment(key, this.attachName, attachment).then((result) => {
            return result.ok;
        }).catch((err) => {
            //document exists, update it
            if (err.status === 409) {
                return this.updateAttachment(key, value);
            } else {
                if (err.status === 404) {
                    //if document not exist, create it and recall attachment
                    return this.createDocument(key, null).then(() => this.saveAttachment(key, value));
                } else {
                    throw err;
                }
            }
        });
    }

    getAttachment(key) {
        return this.db.getAttachment(key, this.attachName).then((blobOrBuffer) => {
            return blobOrBuffer;
        }).catch((err) => {
            throw err;
        });
    }

    updateAttachment(key, value) {
        return this.db.get(key).then((doc) => {
            let attachment = (this.isBrowser) ? new Blob(value, {content_type: 'application/octet-stream'}) : new Buffer(value, {content_type: 'application/octet-stream'});

            return this.db.putAttachment(doc._id, this.attachName, doc._rev, attachment, 'application/octet-stream').then((result) => {
                return result.ok;
            }).catch((err) => {
                throw err;
            });

        }).catch((err) => {
            throw err;
        });
    }

    deleteAttachment(key) {
        return this.db.get(key).then((doc) => {
            return this.db.removeAttachment(doc._id, this.attachName, doc._rev).then((result) => {
                return result;
            }).catch((err) => {
                throw err;
            });
        }).catch((err) => {
            throw err;
        });
    }


    deleteAttachmentIfExist(key) {
        return this.getAttachment(key).then((value) => {
            return this.deleteAttachment(key);
        }).catch((err) => {
            return false;
        })
    }


    //general methods

    save(key, value) {
        if (typeof value === "object") {
            return this.createDocument(key, value);
        } else {
            return this.saveAttachment(key, value);
        }
    }

    get(key) {
        return this.getDocument(key).then(() => {
            return this.getAttachment(key).then(() => {
                return this.getAttachment(key);
            }).catch(() => {
                return this.getDocument(key);
            });
        }).catch((err) => {
            throw err;
        })
    }

    remove(key) {
        return this.deleteDocument(key);
    }

}

module.exports = InterfacePouchDB;