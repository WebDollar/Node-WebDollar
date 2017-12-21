/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */
const PouchDB = require('pouchdb-node');

class InterfacePouchDB {

    constructor(databaseName = "defaultDB") {
        this.dbName = databaseName;
        this.db = new PouchDB(this.dbName);
        this.attachName = 'wallet.bin';
    }

    createDocument(key, value) {
        this.deleteDocumentAttachmentIfExist(key);

        return this.db.put({
            _id: key,
            value: value
        }).then((response) => {
            return true;
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
            return true;
        }).catch((err) => {
            throw err;
        });
    }

    getDocument(key) {
        return this.db.get(key).then((doc) => {
            return doc.value;
        }).catch((err) => {
            throw err;
        });
    }

    deleteDocument(key) {
        return this.db.get(key).then((doc) => {
            return this.db.remove(doc._id, doc._rev);
        }).then((result) => {
            return true;
        }).catch((err) => {
            throw err;
        });
    }

    //attachments

    saveDocumentAttachment(key, value) {
        let buf = Buffer.from(value);
        let attachment = new Buffer(buf, {content_type: 'application/octet-stream'});
        return this.db.putAttachment(key, this.attachName, attachment).then((result) => {
            return true;
        }).catch((err) => {
            //document exists, update it
            if (err.status === 409) {
                return this.updateDocumentAttachment(key, value);
            } else {
                if (err.status === 404) {
                    //if document not exist, create it and recall attachment
                    return this.createDocument(key, null).then(() => this.saveDocumentAttachment(key, value));
                } else {
                    throw err;
                }
            }
        });
    }

    getDocumentAttachment(key) {
        return this.db.getAttachment(key, this.attachName).then((blobOrBuffer) => {
            return blobOrBuffer;
        }).catch((err) => {
            throw err;
        });
    }

    updateDocumentAttachment(key, value) {
        return this.db.get(key).then((doc) => {
            let buf = Buffer.from(value);
            let attachment = new Buffer(buf, {content_type: 'application/octet-stream'});
            return this.db.putAttachment(doc._id, this.attachName, doc._rev, attachment, 'application/octet-stream').then((result) => {
                return true;
            }).catch((err) => {
                throw err;
            });

        }).catch((err) => {
            throw err;
        });
    }

    deleteDocumentAttachment(key) {
        return this.db.get(key).then((doc) => {
            return this.db.removeAttachment(doc._id, this.attachName, doc._rev).then((result) => {
                return true;
            }).catch((err) => {
                throw err;
            });
        }).catch((err) => {
            throw err;
        });
    }


    deleteDocumentAttachmentIfExist(key) {
        return this.getDocumentAttachment(key).then((value) => {
            return this.deleteDocumentAttachment(key);
        }).catch((err) => {
            return false;
        })
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
        return this.getDocument(key).then(() => {
            return this.getDocumentAttachment(key).then((doc) => {
                return this.getDocumentAttachment(key);
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