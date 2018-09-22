import Serialization from "common/utils/Serialization";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto';
import BufferExtended from "common/utils/BufferExtended";

class Product {

    constructor(db,title='',metaDescription='',description='',price=0,imageURL='',contact='',vendorAddress='',vendorP2P='',status=false, taxProof) {

        //Data stored in the whole network
        this.db = db;
        this.title = title;
        this.meta = metaDescription;
        this.price = price;
        this.imageURL = imageURL;
        this.status = status;
        this.lastTimeAvaiable = new Date().getTime();
        this.vendorP2PAddress = vendorP2P;
        this.taxProof = taxProof;

        //Data stored only at vendor
        this.description = description;
        this.contact = contact;
        this.vendorAddress = vendorAddress;

        this.hash = WebDollarCrypto.SHA256(
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

            return({
                resultStatus: await this.deserializeProduct(buffer),
                result: this
            });

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

        //Serialize Title
        let length = this.title.length;
        buffer = Buffer.concat([Serialization.serializeNumber1Byte(length)]);

        for (let i=0; i<length; i++){
            let character = new Buffer(this.title[i],'ascii');
            buffer = Buffer.concat([ new Buffer(buffer),character]);
        }

        //Serialize meta description
        length = this.meta.length;
        buffer = Buffer.concat([ new Buffer(buffer),Serialization.serializeNumber2Bytes(length)]);

        for (let i=0; i<length; i++){
            let character = new Buffer(this.meta[i],'ascii');
            buffer = Buffer.concat([ new Buffer(buffer),character]);
        }

        //Serialize Image Url
        length = this.imageURL.length;
        buffer = Buffer.concat([ new Buffer(buffer),Serialization.serializeNumber2Bytes(length)]);

        for (let i=0; i<length; i++){
            let character = new Buffer(this.imageURL[i],'ascii');
            buffer = Buffer.concat([ new Buffer(buffer),character]);
        }

        //Serialize Vendor P2P
        length = this.vendorP2PAddress.length;
        buffer = Buffer.concat([ new Buffer(buffer),Serialization.serializeNumber2Bytes(length)]);

        for (let i=0; i<length; i++){
            let character = new Buffer(this.vendorP2PAddress[i],'ascii');
            buffer = Buffer.concat([ new Buffer(buffer),character]);
        }

        //Serialize tax proof
        buffer =  Buffer.concat([ new Buffer(buffer), new Buffer( this.taxProof,"hex" )]);

        //Serialize other data
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber7Bytes( this.lastTimeAvaiable/10000 )]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber1Byte ( this.status ? 1 : 0)]);
        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber7Bytes( this.price)]);

        return buffer;

    }

    //TODO - Create String serialization & deserialization function for all following operations
    async deserializeProduct(buffer){

        //Deserialize title
        let length = Serialization.deserializeNumber1Bytes( buffer, 0 );
        let offset = 1;

        let string = '';
        for (let i=0; i<length; i++){
            let character = Serialization.deserializeNumber1Bytes( buffer, offset );
            string += String.fromCharCode(character);
            offset += 1;
        }

        this.title = string;

        //Deserialize meta description
        length = Serialization.deserializeNumber2Bytes( buffer, offset );
        offset += 2;

        string = '';
        for (let i=0; i<length; i++){
            let character = Serialization.deserializeNumber1Bytes( buffer, offset );
            string += String.fromCharCode(character);
            offset += 1;
        }

        this.meta = string.toString();

        //Deserialize image URL
        length = Serialization.deserializeNumber2Bytes( buffer, offset );
        offset += 2;

        string = '';
        for (let i=0; i<length; i++){
            let character = Serialization.deserializeNumber1Bytes( buffer, offset );
            string += String.fromCharCode(character);
            offset += 1;
        }

        this.imageURL = string.toString();

        //Deserialize Vendor P2P
        length = Serialization.deserializeNumber2Bytes( buffer, offset );
        offset += 1;

        string = '';
        for (let i=0; i<length; i++){
            let character = Serialization.deserializeNumber1Bytes( buffer, offset );
            string += String.fromCharCode(character);
            offset += 1;
        }

        this.vendorP2PAddress = string.toString();

        //Deserialize tax proof
        this.taxProof = BufferExtended.substr(buffer, offset, 32);
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