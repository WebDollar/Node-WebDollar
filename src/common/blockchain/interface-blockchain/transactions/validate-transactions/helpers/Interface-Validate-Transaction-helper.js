class InterfaceValidateTransactionHelper{

    validateFrom(from){
        from = from || []

        if (!Array.isArray(from)) from = [from]

        if (from.length === 0) throw 'From is empty Array';

        from.forEach ( (fromObject, index) => {

            if (!fromObject.address || fromObject.address === null) throw 'From.Object Address is not specified';
            if (!fromObject.publicKey || fromObject.publicKey === null) throw 'From.Object Public Key is not specified';
        })

        return from;
    }

    validateTo(to){

        to = to || []

        if (!Array.isArray(to)) to = [to]

        if (to.length === 0) throw 'To is empty Array';

        to.forEach ((toObject, index) =>{

            if (!toObject.address || toObject.address === null) throw 'To.Object Address is not specified';

            if (!toObject.amount || typeof toObject.amount !== "number" ) throw 'To.Object Amount is not specified';
            if (toObject.amount < 0) throw "To.Object Amount is an invalid number";

            if (!toObject.currency || toObject.address === null) throw 'To.Object Currency is not specified';

        })

        return to;
    }


}

export default new InterfaceValidateTransactionHelper()