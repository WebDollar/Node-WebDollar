import sinon from 'sinon';
import { expect, assert } from 'chai';

import AddressBalanceProvider from '../../Utils/AddressBalanceProvider';
import Blockchain from './../../../../main-blockchain/Blockchain';

describe('AddressBalanceProviderTest', () => {
    const AccountantTree = Blockchain.blockchain.accountantTree;

    it ('should throw exception if address is null', () => {
        const oAddressBalanceProvider = new AddressBalanceProvider(AccountantTree);
        expect(() => {
            oAddressBalanceProvider.getBalance(null);
        }).to.throw('Address must be an object containing the "address" property');
    });

    it ('should throw exception if address is undefined', () => {
        const oAddressBalanceProvider = new AddressBalanceProvider(AccountantTree);
        expect(() => {
            oAddressBalanceProvider.getBalance(void 0);
        }).to.throw('Address must be an object containing the "address" property');
    });

    it ('should throw exception if address is not an object containing address property', () => {
        const oAddressBalanceProvider = new AddressBalanceProvider(AccountantTree);
        expect(() => {
            oAddressBalanceProvider.getBalance({});
        }).to.throw('Address must be an object containing the "address" property');
    });

    it ('should return 0 if address is invalid', () => {
        sinon.stub(AccountantTree, 'getBalance').withArgs('WEBD$invalid').returns(0);

        const oAddressBalanceProvider = new AddressBalanceProvider(AccountantTree);
        assert.strictEqual(oAddressBalanceProvider.getBalance({address: 'WEBD$invalid'}), 0);
    });

    it ('should return the current balance if address is valid', () => {
        sinon.stub(AccountantTree, 'getBalance').withArgs('WEBD$valid').returns(100);

        const oAddressBalanceProvider = new AddressBalanceProvider(AccountantTree);
        assert.strictEqual(oAddressBalanceProvider.getBalance({address: 'WEBD$valid'}), 100);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
