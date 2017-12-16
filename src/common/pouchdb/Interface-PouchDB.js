/* Added by Silviu Stroe - www.silviu-s.com */
const PouchDB = require('pouchdb-node');

class InterfacePouchDB {

    constructor(databaseName) {
        this.dbName = (typeof databaseName !== 'undefined' && databaseName !== null ? databaseName : "defaultDB");
        this.db = new PouchDB(this.dbName);
    }

    save(key, value) {
        return this.db.put({
            _id: key,
            value: value
        }).then((response) => {
            return response;
        }).catch((err) => {
            //document exists, update it
            if (err.status === 409) {
                return this.update(key, value)
            } else {
                return err;
            }
        });
    }


    update(key, value) {
        return this.db.get(key).then((doc) => {
            return this.db.put({
                _id: doc._id,
                _rev: doc._rev,
                value: value
            });
        }).then((response) => {
            return response;
        }).catch((err) => {
            return err;
        });
    }

    get(key) {
        return this.db.get(key).then((doc) => {
            return doc;
        }).catch((err) => {
            console.log(err);
        });
    }

    del(key) {
        return this.db.get(key).then((doc) => {
            return this.db.remove(doc);
        }).then((result) => {
            return result;
        }).catch((err) => {
            return err;
        });
    }

    //attachments

    saveAttachment(key, value) {
        let attachment = new Buffer(value);
        return this.db.putAttachment(key, 'wallet.bin', attachment).then((result) => {
            return result;
        }).catch((err) => {
            //document exists, update it
            if (err.status === 409) {
                return this.updateAttachment(key, value);
            } else {
                return err;
            }
        });
    }

    getattachment(key) {
        return this.db.getAttachment(key, 'wallet.bin').then((blobOrBuffer) => {
            return blobOrBuffer;
        }).catch((err) => {
            return err;
        });
    }

    updateAttachment(key, value) {
        return this.db.get(key).then((doc) => {
            let attachment = new Buffer(value);
            return this.db.putAttachment(doc._id, 'wallet.bin', doc._rev, attachment).then((result) => {
                return result;
            }).catch((err) => {
                return err;
            });

        }).catch((err) => {
            return err;
        });
    }

    deleteAttachment(key) {
        return this.db.get(key).then((doc) => {
            return this.db.removeAttachment(doc._id, 'wallet.bin', doc._rev).then((result) => {
                return result;
            }).catch((err) => {
                return err;
            });
        }).catch((err) => {
            return err;
        });
    }


}

module.exports = InterfacePouchDB;