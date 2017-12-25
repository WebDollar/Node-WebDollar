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
        return this.db.get(key, {attachments: true}).then((response) => {
            
            if(response._attachments === undefined) {
                return response.value;
            } else {
                //get attachment
                return new Buffer(atob(response._attachments.key.data).toString('hex'), 'hex');
            }
        }).catch((err) => {
            return err;
        });
    }

    deleteDocument(key) {
        return this.db.get(key, {attachments: true}).then((doc) => {
            return this.db.remove(doc._id, doc._rev).then((response) => {
            }).then((result) => {
                return true;
            }).catch((err) => {
                return err;
            });
        }).catch((err) => {
            return err;
        });
    }

    saveDocumentAttachment(key, value) {

        let attachment = value;
        // we need blob in browser
        if (typeof window !== "undefined" && Buffer.isBuffer(value)) {
            attachment = new Blob([value.toString('hex')]); 
        } else { //we are in node
            attachment = new Buffer(value.toString('hex'));
        }

        return this.db.put({
          _id: key,
          _attachments: {
            key: {
              content_type: 'application/octet-binary',
              data: attachment
            }
          }
        }).then((result) => {
            return true;
        }).catch((err) => {
            if (err.status === 409) {
                return this.updateDocumentAttachment(key, attachment);
            } else {
                if (err.status === 404) {
                    //if document not exist, create it and recall attachment
                    return this.createDocument(key, null).then((response) => {
                        this.saveDocumentAttachment(key, value);
                    }).catch((err) => {
                    });
                } else {
                    throw err;
                }
            }
        });

    }

    updateDocumentAttachment(key, value) {
        return this.db.get(key, {attachments: true}).then((doc) => {

            return this.db.put({
              _id: doc._id,
              _attachments: {
                key: {
                  content_type: 'application/octet-binary',
                  data: value
                }
              },
              _rev: doc._rev
            }).then((result) => {
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
        return this.getDocument(key).then((value) => {
            return this.deleteDocumentAttachment(key);
        }).catch((err) => {
            return false;
        })
    }


    //main methods
    async save(key, value) {
        if (Buffer.isBuffer(value)) {
            return this.saveDocumentAttachment(key, value);
        } else {
            return this.createDocument(key, value);
        }
    }
    
    async get(key) {
        return (await this.getDocument(key));
    }

    async remove(key) {
        return (await this.deleteDocument(key));
    }

}

module.exports = InterfacePouchDB;