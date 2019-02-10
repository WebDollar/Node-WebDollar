import MnemonicWords                    from 'mnemonic.js';
import {authenticatedMethod, RpcMethod} from './../../../../jsonRpc';

/**
 * Create a new account into the wallet
 */
class NewAccount extends RpcMethod {
    constructor(name, oWallet) {
        super(name);
        this._oWallet = oWallet;
    }

    async getHandler(args) {
        const bEncrypt = args[0] || false;
        let oAddress;

        try {
            oAddress = await this._oWallet.createNewAddress();
        }
        catch (e) {
            throw new Error(`Unable to create a new account. Reason: ${e.message}`);
        }

        let aResult = {
            address: oAddress.address
        };

        if (bEncrypt) {
            // 3 words per one integer of 32bits => 4 integers * 3 words => 12 words
            aResult['password']          = (new MnemonicWords(4 * 32)).toWords(4 * 32).join(' ');
            const bEncryptedSuccessfully = await this._oWallet.encryptAddress(oAddress, aResult['password']);

            // Only check against "true" because the way encryptAddress() method returns the results
            if (bEncryptedSuccessfully === true) {
                return aResult;
            }

            const aDeleteResult = await this._oWallet.deleteAddress(oAddress);

            if (aDeleteResult.result === false) {
                throw new Error(`Unable to encrypt account. Reason: ${aDeleteResult.message}`);
            }

            throw new Error('Unable to encrypt account.');
        }

        return aResult;
    }
}

export default authenticatedMethod(NewAccount);
