class AddressBalanceProvider
{
    constructor(oAccountantTree) {
        this._oAccountantTree = oAccountantTree;
    }

    getBalance(oAddress, tokenId = undefined) {
        return this._oAccountantTree.getBalance(oAddress.address, tokenId) || 0;
    }
}

export default AddressBalanceProvider;
