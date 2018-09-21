import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import consts from 'consts/const_global';

class BazaarCommunicationProtocol{

    constructor(){

        let db = new InterfaceSatoshminDB();
        let products = [];

    }

    initializeBazaar(){

        socket.node.on("bazaar/addNewProduct", response =>{

            this.addProduct(response.product)

        });

        socket.node.on("bazaar/searchProduct", response =>{

            this.searchProduct(response.product)

        });

        socket.node.on("bazaar/vendorConnected", response =>{

            this.vendorConnected(response.vendorAddress)

        });

        socket.node.on("bazaar/vendorDisconnected", response =>{

            this.vendorDisconnected(response.vendorAddress)

        });

    }

    propagateToTheNetword(type,data){

        //To DO send to all connected sockets
        socket.node.sendRequest(type, data);

    }

    async addProduct(newProduct){

        if( this.verifyProduct(newProduct) ){

            let serializedProduct;
            let productID;

            try{

                serializedProduct = this.serializeProduct(newProduct);
                let response = await db.save("Product-"+productID, serializedProduct);
                this.products.push(newProduct);

            }catch(exc){

                throw {message: "Error while saving Product to DB"};

            }

            this.propagateToTheNetword("bazaar/addNewProduct",{ product: serializedProduct, id: productID });

        }

    }

    async searchProduct(keyWord){

        let resuls = [];

        for(var i=0; i<=this.products.length; i++){

            let foundItem = {};

            if(this.products[i].title.includes(keyWord)){
                foundItem.foundInTitle=true;
                foundItem.product=this.products[i];
                resuls.push(foundItem);
            }

            if(this.products[i].meta.includes(keyWord)){
                foundItem.foundInTitle=false;
                foundItem.product=this.products[i];
                resuls.push(foundItem);
            }

        }

        return resuls;

    }

    async vendorConnected(vendorAddress){

        for(var i=0; i<=this.products.length; i++){

            if(this.products[i].vendorAddress === vendorAddress){

                this.products[i].status=true;
                this.propagateToTheNetword("bazaar/vendorConnected",{ vendorAddress: vendorAddress });

            }

        }

    }

    async vendorDisconnected(vendorAddress){

        for(var i=0; i<=this.products.length; i++){

            if(this.products[i].vendorAddress === vendorAddress){

                this.products[i].status=false;
                this.products[i].lastTimeAvaiable=new Date();

                this.propagateToTheNetword("bazaar/vendorDisconnected",{ vendorAddress: vendorAddress });

            }

        }

    }

    deleteOldProducts(){

        for(var i=0; i<=this.products.length; i++) {

            let currentdate = new Date();

            if ( this.products[i].lastTimeAvaiable + consts.BAZAAR.PRODUCTS_PURGE_INTERVAL >= currentdate ) {

                this.products[i].splice(i,1);
                // Remove from DB

            }

    }

}

export default new BazaarCommunicationProtocol();