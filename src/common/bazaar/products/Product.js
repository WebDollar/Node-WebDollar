import Serialization from "common/utils/Serialization";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto';
import BufferExtended from "common/utils/BufferExtended";

class Product {

    constructor(db,title='',metaDescription='', imageURL='', price=0, vendorSignature, vendorP2P='',status=false ,description='', contact='', vendorAddress='', taxProof) {

        //Data stored in the whole network
        this.db = db;
        this.title = title;
        this.meta = metaDescription; // Product short description
        this.price = price;
        this.imageURL = imageURL; // Product image url
        this.status = status; // If vendor is avaiable or not
        this.lastTimeAvaiable = new Date().getTime(); // When the product wass added
        this.vendorP2PAddress = vendorP2P; // Where buyer should connect p2p
        this.taxProof = taxProof; // Transaction tax for being able to propagate product

        //Data stored only at vendor
        this.description = description; // Product full description
        this.contact = contact; // Vendor contact

        this.hash = this.getProductHash();

    }

    getProductHash(){

        return WebDollarCrypto.SHA256(
            Buffer.concat ([
                Buffer.from(this.title, "ascii"),
                Buffer.from(this.meta, "ascii"),
                Buffer.from(this.imageURL, "ascii"),
                Serialization.serializeNumber7Bytes(this.price)
            ])
        ).toString('hex');

    }

    async saveProduct(){

        let key = "product-" + this.hash;

        let bufferValue;

        try {
            bufferValue = await this.serializeProduct();
        } catch (exception){
            console.error('ERROR serializing product: ',  exception);
            throw exception;
        }

        let saveResult = undefined;

        try{
            saveResult = await this.db.save(key, bufferValue)
        }
        catch (exception){
            console.error('ERROR on SAVE product: ',  exception);
            throw exception;
        }

        return({
            resultStatus: (saveResult !== undefined || saveResult !== null) ? true : false,
            result: saveResult
        });

    }

    //TODO If product is expired don't include it back.
    async loadProduct(){

        let key = "product-" + this.hash;

        try{

            let buffer = await this.db.get(key, 12000);

            if (buffer === null) {
                console.error("product with hash "+this.hash+" was not found "+ key);
                return false;
            }

            let deserializedProduct = await this.deserializeProduct(buffer);

            if( deserializedProduct ){

                return({
                    resultStatus: true,
                    result: this
                });

            }
            else{

                return({
                    resultStatus: false,
                    result: this
                });

            }

        }
        catch(exception) {
            console.error( 'ERROR on LOAD product: ', exception);
            return false;
        }
    }

    async removeProduct() {

        let key = "product-" + this.hash;

        try{

            return (await this.db.remove(key));

        }
        catch(exception) {
            return 'ERROR on REMOVE product: ' + exception;
        }

    }

    // validateProductHash(){
    //
    //
    //
    // }

    async serializeProduct(){

        let buffer = [];

        //Serialize Strings
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeString(this.title, 1) ]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeString(this.meta, 2) ]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeString(this.imageURL, 2) ]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeString(this.vendorP2PAddress, 2) ]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeString(this.description, 2) ]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeString(this.contact, 1) ]);

        //Serialize other data
        buffer = Buffer.concat([ new Buffer(buffer), new Buffer( this.taxProof,"hex" )]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber7Bytes( this.lastTimeAvaiable/10000 )]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber1Byte ( this.status ? 1 : 0)]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber7Bytes( this.price)]);

        return buffer;

    }

    async deserializeProduct(buffer){

        let offset = 0;
        let result;

        //Deserialize title
        result = Serialization.deserializeString( buffer, 0, 1);
        this.title = result.data;
        offset = result.offset;

        //Deserialize meta description
        result = Serialization.deserializeString( buffer, offset, 2);
        this.meta = result.data;
        offset = result.offset;

        //Deserialize image URL
        result = Serialization.deserializeString( buffer, offset, 2);
        this.imageURL = result.data;
        offset = result.offset;

        //Deserialize Vendor P2P
        result = Serialization.deserializeString( buffer, offset, 2);
        this.vendorP2PAddress = result.data;
        offset = result.offset;

        //Deserialize Vendor P2P
        result = Serialization.deserializeString( buffer, offset, 2);
        this.description = result.data;
        offset = result.offset;

        //Deserialize Vendor P2P
        result = Serialization.deserializeString( buffer, offset, 1);
        this.contact = result.data;
        offset = result.offset;

        //Deserialize tax proof
        this.taxProof = BufferExtended.substr(buffer, offset, 32).toString('hex');
        offset += 32;

        //Deserialize other data
        this.lastTimeAvaiable = Serialization.deserializeNumber7Bytes( buffer, offset )*10000;
        offset += 7;

        this.status = ( Serialization.deserializeNumber1Bytes( buffer, offset ) === 1 ) ? true : false;
        offset += 1;

        this.price = Serialization.deserializeNumber7Bytes( buffer, offset );
        offset += 7;

        return true;

    }

}

export default Product;