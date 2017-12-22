/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */

var toBuffer = require('blob-to-buffer')

let PouchDB;
 
if (typeof window === "undefined")
     PouchDB = require('pouchdb-node');
 else
    PouchDB = require('pouchdb');

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
        
       
        if ( (typeof value === "object" && value.constructor.name !== "Blob") && !Buffer.isBuffer(value))
            value = Buffer.from(value);
        
        let attachment = value;
        
        // we need blob in browser
        if (typeof window !== "undefined" && Buffer.isBuffer(value))
            attachment = new Blob( value , { type: 'application/octet-stream' });
             
        console.log("aveeem blooog", typeof attachment, attachment);

        //let attachment = new Buffer(buf, {content_type: 'application/octet-stream'});             
        
        return this.db.putAttachment(key, this.attachName, attachment).then((result) => {
            return true;
        }).catch((err) => {
            //document exists, update it
            if (err.status === 409) {
                return this.updateDocumentAttachment(key, attachment);
            } else {
                if (err.status === 404) {
                    //if document not exist, create it and recall attachment
                    return this.createDocument(key, null).then(() => this.saveDocumentAttachment(key, attachment));
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
            
                    if ( (typeof value === "object" && value.constructor.name !== "Blob") && !Buffer.isBuffer(value))
                value = Buffer.from(value);

            
            let attachment = value;
            
            // we need blob in browser
            if (typeof window !== "undefined" && Buffer.isBuffer(value))
                attachment = new Blob( value , { type: 'application/octet-stream' });

            
            
            
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
    
    toBuffer2(ab) {
        var buffer = new Buffer(ab.byteLength);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
        return buffer;
    }

    async get(key) {
        
        try{
        
            let doc = await this.getDocument(key);
            
            try{
                let attachment =  await this.getDocumentAttachment(key);
                
                console.log("attachment ----------------------- ", typeof attachment, attachment );
                
                //we are in browser, we need to convert the blob to buffer
                if (typeof window !== "undefined") {
                    
                    return this.toBuffer2(attachment);
                    
                    /*
                    return new Promise ( (resolve) => {
                        
                        toBuffer(attachment, function (err, buffer) {
                          if (err) throw err
                          
                           resolve(buffer);
                        })
                                               
                    });
                    */
                    
                } else                 
                return attachment;
                
            } catch (exception){
                
                return await this.getDocument(key);
                
            }          
        
        } catch (exception){
            console.log("get exception", exception);
            throw exception;
        }
        
     
    }

    remove(key) {
        return this.deleteDocument(key);
    }

}

module.exports = InterfacePouchDB;