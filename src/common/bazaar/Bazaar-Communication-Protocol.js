import consts from 'consts/const_global';
import ProductsManager from "common/bazaar/products/ProductsManager";

class BazaarCommunicationProtocol{

    constructor(){

        this.lastSearchResults = []

    }

    openBazaar(socket){

        //----------------------
        //-------Product--------
        //----------------------

        socket.node.on("bazaar/newProductHash", async (response) =>{

           await this.processNewProductHash( response.hash, socket )

        });

        socket.node.on("bazaar/getProduct", async (response) =>{

            await this.sendProductByHash( response.hash, socket );

        });

        socket.node.on("bazaar/getProductResponse", async (response) =>{

            await this.processNewProduct( response.buffer );

        });

        //---------------------
        //-------Search--------
        //---------------------

        socket.node.on("bazaar/searchProduct", async (response) =>{

            await this.searchProduct( response.keyword, socket )

        });

        socket.node.on("bazaar/searchProductResponse", async (response) =>{

            await this.processSearchResult( response.buffer );

        });

        //---------------------------
        //-------VendorStatus--------
        //---------------------------

        socket.node.on("bazaar/vendorConnected", response =>{

            this.vendorConnected(response.vendorAddress)

        });

        socket.node.on("bazaar/vendorDisconnected", response =>{

            this.vendorDisconnected(response.vendorAddress)

        });

    }

    processNewProductHash( hash, socket ){

        let product = ProductsManager.getProductByHash( hash );

        if(!product)
            socket.node.sendRequest("bazaar/getProduct", { hash: hash });

    }

    sendProductByHash( hash, socket ){

        let product = ProductsManager.getProductByHash( hash );

        if(product)
            socket.node.sendRequest("bazaar/sendProduct", { buffer: product.serializeProduct(false) });

    }

    async processNewProduct(newProduct){

        let storeResult = await ProductsManager.storeProduct( newProduct );

        if(storeResult.resultStatus)
            this.propagateToTheNetword("bazaar/newProductHash",{ hash: storeResult.result.hash });

    }

    searchProduct( keyword, socket ){

        let searchResult = ProductsManager.searchProductByKey( keyword );

        if(!searchResult.resultStatus)
            socket.node.sendRequest("bazaar/searchProductResponse", { buffer: false });
        else
            socket.node.sendRequest("bazaar/searchProductResponse", { buffer: searchResult.result });

    }

    processSearchResult( buffer ){

        if(!buffer)
            this.lastSearchResults = [];
        else
            this.lastSearchResults = ProductsManager.deserializeSearchResult( buffer );

    }

    propagateToTheNetword(type,data){

        //TODO send to all connected sockets
        socket.node.sendRequest(type, data);

    }

    // async vendorConnected(vendorAddress){
    //
    //     for(var i=0; i<=this.products.length; i++){
    //
    //         if(this.products[i].vendorAddress === vendorAddress){
    //
    //             this.products[i].status=true;
    //             this.propagateToTheNetword("bazaar/vendorConnected",{ vendorAddress: vendorAddress });
    //
    //         }
    //
    //     }
    //
    // }
    //
    // async vendorDisconnected(vendorAddress){
    //
    //     for(var i=0; i<=this.products.length; i++){
    //
    //         if(this.products[i].vendorAddress === vendorAddress){
    //
    //             this.products[i].status=false;
    //             this.products[i].lastTimeAvaiable=new Date();
    //
    //             this.propagateToTheNetword("bazaar/vendorDisconnected",{ vendorAddress: vendorAddress });
    //
    //         }
    //
    //     }
    //
    // }

}

export default new BazaarCommunicationProtocol();