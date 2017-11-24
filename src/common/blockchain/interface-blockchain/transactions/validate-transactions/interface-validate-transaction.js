class InterfaceValidateTransaction{

    /**
     *
     * @param from must be an object {address: obj, publicKey: xxxx}
     * @param to
     * @param amount
     * @param currency
     */

    validate(from, to, amount, currency){

        if (!from) throw 'Validation Invalid: From was not specified';
        if (!from.address) throw 'Validation Invalid: from.Address was not specified'

        if (!to) throw 'Validation Invalid: To was not specified'

        if (typeof amount !== 'number' || amount < 0) throw 'Amount is not a valid number';
        if (!currency) currency = ''

        return true;

    }

}

export default InterfaceValidateTransaction