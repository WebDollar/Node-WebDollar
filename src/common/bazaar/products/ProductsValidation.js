class ProductsValidation {

    constructor() {}

    isDuplicate(productsList, hash){

        for( let i=0; i<productsList; i++ )
            if(productsList[i].hash === hash)
                return {
                    result: true,
                    message: "This product already exist"
                };

        return {
            result: false
        };

    }

    validateProductFormat(product){

        if( product===undefined || product===null )
            return {
                result: false,
                message: "This product is not valid"
            };

        return {
            result: true
        };

    }

}

export default new ProductsValidation();