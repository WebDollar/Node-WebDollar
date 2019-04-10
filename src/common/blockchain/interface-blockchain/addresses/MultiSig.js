/*
 * Copyright (c) Silviu Stroe 2018.
*/
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

const BitcoinJS = require('bitcoinjs-lib')
const Bigi = require('bigi')
const Crypto = require('crypto')

class MultiSig {
  /**  users public Keys which are used in generating a multi sig address
     *
     *
     * @param publicKeys
     * @returns {*}
     *
     * Example:
     *
     let pubKeys = [
     '026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01',
     '02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9',
     '03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9'
     ];
     let address = InterfaceBlockchainAddressHelper2.generateAddress(pubKeys);
     */
  static generateAddress (publicKeys, numKeysRequired = 2) {
    let pubKeys = publicKeys.map(function (hex) {
      return Buffer.from(hex, 'hex')
    })

    let redeemScript = BitcoinJS.script.multisig.output.encode(numKeysRequired, pubKeys) // 2 of 3
    let scriptPubKey = BitcoinJS.script.scriptHash.output.encode(BitcoinJS.crypto.hash160(redeemScript))
    let address = BitcoinJS.address.fromOutputScript(scriptPubKey)

    return address
  }

  static multisigPrivateKey (privateKey) {
    return privateKey
  }

  /**
     * create (and broadcast via 3PBP) a Transaction with a 2-of-4 P2SH(multisig) input
     * https://github.com/BitcoinJSjs/BitcoinJSjs-lib/blob/e0f24fdd46e11533a7140e02dc43b04a4cc4522e/test/integration/transactions.js#L115
     */
  static createTransaction (numKeysRequired) {
    let keyPairs = [
      '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgwmaKkrx', // public keys not public addresses
      '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgww7vXtT',
      '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgx3cTMqe',
      '91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgx9rcrL7'
    ].map(function (wif) {
      return BitcoinJS.ECPair.fromWIF(wif, testnet)
    })
    let pubKeys = keyPairs.map(function (x) {
      return x.getPublicKeyBuffer()
    })

    let redeemScript = BitcoinJS.script.multisig.output.encode(numKeysRequired, pubKeys)
    let scriptPubKey = BitcoinJS.script.scriptHash.output.encode(BitcoinJS.crypto.hash160(redeemScript))
    let address = BitcoinJS.address.fromOutputScript(scriptPubKey, testnet)

    testnetUtils.faucet(address, 2e4, function (err, unspent) {
      if (err) { return done(err) }

      let txb = new BitcoinJS.TransactionBuilder(testnet)
      txb.addInput(unspent.txId, unspent.vout)
      txb.addOutput(testnetUtils.RETURN_ADDRESS, 1e4)

      txb.sign(0, keyPairs[0], redeemScript)
      txb.sign(0, keyPairs[2], redeemScript)

      let tx = txb.build()

      // build and broadcast to the BitcoinJS Testnet network
      testnetUtils.transactions.propagate(tx.toHex(), function (err) {
        if (err) { return done(err) }

        testnetUtils.verify(address, tx.getId(), 1e4, done)
      })
    })
  }

  /*
    * @param datesSalt is used as salt data for generating a privateKey
    * @returns a privateKey generated from a salt, @param datesSalt
    */
  static createPrivateKey (saltDates) {
    let concatDatesSalt = ''

    for (let i = 0; i < saltDates.length; ++i) {
      concatDatesSalt += saltDates[i]
    }

    return WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(concatDatesSalt))
  }

  static getPublicKeyFromPrivate (privateKey) {
    return InterfaceBlockchainAddressHelper._generatePublicKey(privateKey)
  }

  static signMessage (msg, privateKey) {
    return InterfaceBlockchainAddressHelper.signMessage(msg, privateKey)
  }

  static validateSignedMessage (msg, signature, publicKey) {
    return InterfaceBlockchainAddressHelper.verifySignedData(msg, signature, publicKey)
  }

  /**
     * Generates 3 users' private keys => 3 users public Keys which are used in generating a multi sig address
     * each users privateKey is mapped with multisig address to return the multisig privateKey attached to the user privateKey
     * @returns {{}}
     */
  static makeMultisigAddress (saltDates) {
    let concatDatesSalt = ''

    for (let i = 0; i < saltDates.length; ++i) {
      concatDatesSalt += saltDates[i]
    }

    let privateKeys = [
      BitcoinJS.ECPair.makeRandom(saltDates),
      BitcoinJS.ECPair.makeRandom(saltDates),
      BitcoinJS.ECPair.makeRandom(saltDates)
    ]

    console.log('pk0=', privateKeys[0])
    console.log('pk1=', privateKeys[1])
    console.log('pk2=', privateKeys[2])
    /*
        let pubKeys = privateKeys.map(function(x) { return x.pub });

        let redeemScript = BitcoinJS.scripts.multisigOutput(2, pubKeys);
        let scriptPubKey = BitcoinJS.scripts.scriptHashOutput(redeemScript.getHash());
        let address = BitcoinJS.Address.fromOutputScript(scriptPubKey).toString();

        let o = {};
        o.address = address;
        o.redeemScript = redeemScript.toHex();
        o.privateKeys = privateKeys.map(function(x) { return x.toWIF() });

        return o; */
  }

  /**
     *
     * @param buffer is the data to be encrypted
     * @param passwordsArray is the array with password for encrypt
     * @returns multiAES encryption of buffer
     */
  static getMultiAESEncrypt (buffer, passwordsArray) {
    let multiEncrypt = buffer

    for (let i = 0; i < passwordsArray.length; ++i) {
      multiEncrypt = WebDollarCrypto.encryptAES(multiEncrypt, passwordsArray[i])
      if (multiEncrypt === null) { return null }
    }

    return Buffer.from(multiEncrypt)
  }

  /**
     *
     * @param buffer is the data to be decrypted
     * @param passwordsArray is the array with password for decrypt
     * @returns multiAES decryption of buffer
     */
  static getMultiAESDecrypt (buffer, passwordsArray) {
    let multiDecrypt = buffer

    for (let i = passwordsArray.length - 1; i >= 0; --i) {
      multiDecrypt = WebDollarCrypto.decryptAES(multiDecrypt, passwordsArray[i])
      if (multiDecrypt === null) { return null }
    }

    return Buffer.from(multiDecrypt)
  }
}

export default MultiSig
