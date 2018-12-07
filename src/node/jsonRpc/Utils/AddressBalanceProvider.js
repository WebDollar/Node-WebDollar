import {isObject} from 'lodash';

class AddressBalanceProvider
{
    constructor(oAccountantTree) {
        this._oAccountantTree = oAccountantTree;
    }

    getBalance(oAddress, tokenId = undefined) {
        //@TODO refactor this when an actual "Address" object is used in the project and check with "instanceof"

        if (isObject(oAddress) === false || typeof oAddress.address === "undefined")
        {
            throw new Error('Address must be an object containing the "address" property')
        }

        let nBalance = null;

        try
        {
             nBalance = this._oAccountantTree.getBalance(oAddress.address, tokenId);
        }
        catch (e)
        {
            throw new Error('Address is invalid');
        }

        if (nBalance === null)
        {
            throw new Error('Address is invalid');
        }

        return nBalance;
    }
}

export default AddressBalanceProvider;
