import singleProduct from './Product'
import consts from 'consts/const_global';
import ProductsValidation from './ProductsValidation'
import BufferExtended from "common/utils/BufferExtended";
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import Serialization from "common/utils/Serialization";

class ProductsManager {

    constructor() {

        this.db = new InterfaceSatoshminDB('ProductsDB');

        //TODO - (Optimisation) Don't save all products in RAM
        this.products = [];

        //TODO SetInterval for clear old products (OLD means >5 Days)

    }

    async loadAllProducts(){

        let buffer = await this.loadProductsListFromDB();
        let offset = 0;

        if( buffer.resultStatus ){

            while( offset !== buffer.result.length ){

                let newProduct = new singleProduct(this.db);

                newProduct.hash = BufferExtended.substr( buffer.result, offset, 32 ).toString('hex');
                offset += 32;

                let product = await newProduct.loadProduct();

                if( product )
                    this.products.push(product);

            }

        }

    }

    async loadProductsListFromDB(){

        try{

            let buffer = await this.db.get( "productsList", 12000 );

            if (buffer === null) {
                console.error("products list was not found ");
                return false;
            }

            return({
                resultStatus: ( buffer !== undefined || buffer !== null ) ? true : false,
                result: buffer
            });

        }
        catch(exception) {

            console.error( 'ERROR on LOAD product: ', exception );
            return false;

        }

    }

    async saveProductsListInDB(){

        let bufferValue;

        try {

            bufferValue = await this.serializeProductsHashesList();

        } catch (exception){

            console.error('ERROR serializing products list: ',  exception);
            throw exception;

        }

        let saveResult = undefined;

        try{

            saveResult = await this.db.save( "productsList", bufferValue );

        }
        catch (exception){

            console.error('ERROR on SAVE products list: ',  exception);
            throw exception;

        }

        return({
            resultStatus: (saveResult !== undefined || saveResult !== null) ? true : false,
            result: saveResult
        });

    }

    serializeProductsHashesList(){

        let buffer = [];

        for( let i=0; i<this.products.length; i++ )
            buffer = Buffer.concat([ new Buffer(buffer), new Buffer(this.products[i].hash,"hex") ]);

        return buffer;

    }

    getProductByHash(hash){

        for(let i=0; i<this.products.length; i++)
            if(this.products[i].hash === hash)
                return this.products[i];

        return false;

    }

    async storeProduct( buffer ){

        let newProduct = new singleProduct( this.db );
        await newProduct.deserializeProduct( buffer, false );

        let processResponse =  await this.processProduct( newProduct );

        if(processResponse)
            return{
                resultStatus: true,
                result: newProduct.hash
            };
        else
            return{
                resultStatus: false,
            }

    }

    async createNewProduct(title,metaDescription,imageURL,price,vendorP2P,status,description,contact,vendorAddress,taxProof){

        let newProduct = new singleProduct( this.db, title, metaDescription, imageURL, price, vendorP2P, status, description, contact, vendorAddress, taxProof);

        return await this.processProduct( newProduct );

    }

    async processProduct( product ){

        let isDuplicate = ProductsValidation.isDuplicate( this.products, product.hash );
        let isValidProduct = ProductsValidation.validateProductFormat( product );

        if( isDuplicate.result ){

            console.error( isDuplicate.message );
            return false;

        }
        else {

            if ( isValidProduct.result ) {

                let saveResult = await product.saveProduct();

                if ( saveResult.resultStatus ){

                    this.products.push( product );
                    await this.saveProductsListInDB();
                    return true;

                }else{

                    console.error( "Save did not succeed" );
                    return false;

                }

            }else{

                console.error( isValidProduct.message );
                return false;

            }

        }

    }

    //TODO - Activate the products cleaner
    async deleteOldProducts() {

        for (let i = 0; i < this.products.length; i++) {

            let currentdate = new Date();

            if (this.products[i].lastTimeAvaiable + consts.BAZAAR.PRODUCTS_PURGE_INTERVAL >= currentdate) {

                let deleteResponse = await this.products[i].removeProduct();

                if( typeof deleteResponse !== "string" )
                    this.products[i].splice(i, 1);

            }

        }

    }

    async searchProductByKey( keyWord ){

        let resultsNumber = 0;
        let resulsInTitle = [];
        let resultsInDesc = [];

        for(var i=0; i<this.products.length; i++){

            if(this.products[i].title.includes(keyWord)){
                resulsInTitle.push(this.products[i]);
                resultsNumber++;
            }

            if(this.products[i].meta.includes(keyWord)){
                resultsInDesc.push(this.products[i]);
                resultsNumber++;
            }

            if( resultsNumber >= consts.BAZAAR.MAXIMUM_SEARCH_RESULTS )
                i = this.products.length;

        }

        if( resulsInTitle.length===0 && resulsInTitle.length===0 )
            return {
                resultStatus:false
            };

        let results = resulsInTitle.concat(resultsInDesc);

        return {
            resultStatus: true,
            result: this.serializeSearchResult(results)
        };

    }

    async serializeSearchResult( productsList ){

        let buffer = [];

        buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber1Byte(productsList.length) ]);

        for( let i=0; i<productsList.length; i++){

            let productBuffer = productsList[i].serializeProduct(false);

            buffer = Buffer.concat([ new Buffer(buffer), Serialization.serializeNumber2Bytes( productBuffer.length ) ]);
            buffer = Buffer.concat([ new Buffer(buffer), new Buffer(productBuffer) ]);

        }

        return buffer;

    }

    async deserializeSearchResult( buffer ){

        let productsList = [];
        let offset = 0;

        let length = Serialization.deserializeNumber1Bytes( buffer, 0 );
        offset++;

        for( let i=0; i<length; i++ ){

            let productBufferLength = Serialization.deserializeNumber2Bytes( buffer, offset );
            offset += 2;

            let product = new singleProduct();

            product.deserializeProduct(buffer, false, offset);
            offset += productBufferLength;

            productsList.push( product );

        }

        return productsList;

    }

}

export default new ProductsManager();