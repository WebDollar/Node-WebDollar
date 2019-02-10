import MnemonicWords                    from 'mnemonic.js';
import {authenticatedMethod, RpcMethod} from './../../../../jsonRpc';

/**
 * Encrypt an account from the wallet
 */
class EncryptAccount extends RpcMethod {
    constructor(name, oWallet) {
        super(name);
        this._oWallet = oWallet;
    }

    async getHandler(args) {
        let sAddress = args[0] || null;
        let oAddress = this._oWallet.getAddress(sAddress);

        if (oAddress === null) {
            throw new Error('Account not found.');
        }

        if (await this._oWallet.isAddressEncrypted(oAddress)) {
            throw new Error('Account is already encrypted.');
        }

        const sPassword              = (new MnemonicWords(4 * 32)).toWords(4 * 32).join(' ');
        const bEncryptedSuccessfully = await this._oWallet.encryptAddress(oAddress, sPassword);

        // Only check against "true" because the way encryptAddress() method returns the results
        if (bEncryptedSuccessfully === true) {
            return sPassword;
        }
        else {
            throw new Error('Unable to encrypt account.');
        }
    }
}

export default authenticatedMethod(EncryptAccount);
