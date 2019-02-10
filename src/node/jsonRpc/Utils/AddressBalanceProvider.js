import {isObject} from 'lodash';

class AddressBalanceProvider {
    constructor(oAccountantTree) {
        this._oAccountantTree = oAccountantTree;
    }

    getBalance(oAddress, tokenId) {
        tokenId = tokenId || void 0;

        //@TODO refactor this when an actual "Address" object is used in the project and check with "instanceof"

        if (isObject(oAddress) === false || typeof oAddress.address === 'undefined') {
            throw new Error('Address must be an object containing the "address" property');
        }

        let nBalance = null;

        try {
            nBalance = this._oAccountantTree.getBalance(oAddress.address, tokenId);
        }
        catch (e) {
            throw new Error('Address is invalid');
        }

        // If the address is valid but it`s not present in the Accountant tree, return 0 balance
        if (nBalance === null) {
            return 0;
        }

        return nBalance;
    }
}

export default AddressBalanceProvider;
