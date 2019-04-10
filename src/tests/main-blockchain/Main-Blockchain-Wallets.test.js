import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

import Blockchain from 'main-blockchain/Blockchain'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import MultiSig from 'common/blockchain/interface-blockchain/addresses/MultiSig'

let assert = require('assert')
let FileSystem = require('fs')

describe('test save wallet to local storage', () => {
  let response = null

  it('save/load/remove/load wallet to/from local storage, sample test', async () => {
    let blockchainAddress = await Blockchain.Wallet.createNewAddress()
    let address = blockchainAddress.address
    let unencodedAddress = blockchainAddress.unencodedAddress
    let publicKey = blockchainAddress.publicKey
    let privateKey = await blockchainAddress._getPrivateKey()

    assert(typeof address === 'string', 'address is not a string')
    assert(Buffer.isBuffer(unencodedAddress), 'unencodedAddress is not not buffer')
    assert(Buffer.isBuffer(publicKey), 'publicKey is not not buffer')
    assert(Buffer.isBuffer(privateKey), 'privateKey is not not buffer')

    response = await blockchainAddress.saveAddress()
    assert(response === true, 'save: ' + response)

    response = await blockchainAddress.loadAddress()
    assert(response === true, 'load: ' + response)

    let address2 = blockchainAddress.address
    let unencodedAddress2 = blockchainAddress.unencodedAddress
    let publicKey2 = blockchainAddress.publicKey
    let privateKey2 = await blockchainAddress._getPrivateKey()

    assert(address2 === address, 'address differ after load: ' + address2 + '!==' + address)
    assert(unencodedAddress2.equals(unencodedAddress), 'unencodedAddress differ after load: ' + unencodedAddress2.toString('hex') + '!==' + unencodedAddress.toString('hex'))
    assert(publicKey2.equals(publicKey), 'publicKey differ after load: ' + publicKey2.toString('hex') + '!==' + publicKey.toString('hex'))
    assert(privateKey2.equals(privateKey), 'privateKey differ after load: ' + privateKey2.toString('hex') + '!==' + privateKey.toString('hex'))

    response = await blockchainAddress.removeAddress()
    assert(response === true, 'remove: ' + response)

    response = await blockchainAddress.loadAddress()
    assert(response !== true, 'load: ' + response)
  })

  it('save/save/remove/load/ wallet to/from local storage, sample test', async () => {
    let blockchainAddress = await Blockchain.Wallet.createNewAddress()
    let address = blockchainAddress.address
    let unencodedAddress = blockchainAddress.unencodedAddress
    let publicKey = blockchainAddress.publicKey
    let privateKey = await blockchainAddress._getPrivateKey()

    response = await blockchainAddress.saveAddress()
    assert(response === true, 'save: ' + response)

    response = await blockchainAddress.saveAddress()
    assert(response === true, 'save: ' + response)

    response = await blockchainAddress.removeAddress()
    assert(response === true, 'remove: ' + response)

    response = await blockchainAddress.loadAddress()
    assert(response !== true, 'load: ' + response)
  })

  it('test save/load/remove/load with AES encrypt/decrypt privateKey', async () => {
    let blockchainAddress = await Blockchain.Wallet.createNewAddress()
    let address = blockchainAddress.address
    let unencodedAddress = blockchainAddress.unencodedAddress
    let publicKey = blockchainAddress.publicKey
    let privateKey = await blockchainAddress._getPrivateKey()
    let password = 'password'

    // blockchainAddress.encrypt(password);

    response = await blockchainAddress.saveAddress()
    assert(response === true, 'save: ' + response)

    response = await blockchainAddress.loadAddress()
    assert(response === true, 'load: ' + response)

    let address2 = blockchainAddress.address
    let unencodedAddress2 = blockchainAddress.unencodedAddress
    let publicKey2 = blockchainAddress.publicKey
    let privateKey2 = await blockchainAddress._getPrivateKey()

    assert(address2 === address, 'address differ after load: ' + address2 + '!==' + address)
    assert(unencodedAddress2.equals(unencodedAddress), 'unencodedAddress differ after load: ' + unencodedAddress2.toString('hex') + '!==' + address.toString('hex'))
    assert(publicKey2.equals(publicKey), 'publicKey differ after load: ' + publicKey2.toString('hex') + '!==' + publicKey.toString('hex'))
    assert(privateKey2.equals(privateKey), 'privateKey differ after load: ' + privateKey2.toString('hex') + '!==' + privateKey.toString('hex'))

    response = await blockchainAddress.removeAddress()
    assert(response === true, 'remove: ' + response)

    response = await blockchainAddress.loadAddress()
    assert(response !== true, 'load: ' + response)
  })

  it('load/store wallet manager', async () => {
    assert(typeof Blockchain.Wallet.addresses !== 'undefined', 'Default wallet is not created')
  })

  it('test export/import wallet privateKeys', async () => {
    for (let i = 0; i < Blockchain.Wallet.addresses.length; i++) {
      let privateKey = await Blockchain.Wallet.addresses[i]._getPrivateKey()
      let totalMultiSig = 3
      let requiredMultiSig = 2
      let fileName = 'privateKey' + i + '.bin'

      response = await Blockchain.Wallet.addresses[i].exportPrivateKey(fileName, totalMultiSig, requiredMultiSig)
      assert(response === true, 'Error exporting privateKey: ' + response)

      response = await Blockchain.Wallet.addresses[i].importPrivateKey('privateKey' + i + '.bin')
      assert(response.result === true, 'Error importing privateKey: ' + response.result)
      assert(response.totalMultiSig === totalMultiSig, 'Total multiSig differ: ' + response.totalMultiSig)
      assert(response.requiredMultiSig === requiredMultiSig, 'Total multiSig differ: ' + response.requiredMultiSig)

      let privateKey2 = await Blockchain.Wallet.addresses[i]._getPrivateKey()
      assert(privateKey2.equals(privateKey), 'PrivateKey differ after import: ' + privateKey2.toString('hex') + '!==' + privateKey.toString('hex'))

      FileSystem.unlinkSync(fileName)
    }
  })

  it('test export/import wallet privateKeys from string', async () => {
    for (let i = 0; i < Blockchain.Wallet.addresses.length; ++i) {
      let privateKey = await Blockchain.Wallet.addresses[i]._getPrivateKey()
      let privateKeyString = await Blockchain.Wallet.addresses[i].exportPrivateKeyToString()

      response = await Blockchain.Wallet.addresses[i].importPrivateKeyFromString(privateKeyString)
      assert(response === true, 'Error loading privateKey from string: ' + response)

      let privateKey2 = await Blockchain.Wallet.addresses[i]._getPrivateKey()
      assert(privateKey2.equals(privateKey), 'PrivateKey differ after importing from string: ' + privateKey.toString('hex') + '!==' + privateKey2.toString('hex'))
    }
  })

  it('test export/import wallet addresses', async () => {
    let addresses = Blockchain.Wallet.addresses

    response = await Blockchain.Wallet.exportWallet('addresses.bin')
    assert(response === true, 'Error exporting addresses! : ' + response + '.')
    Blockchain.Wallet.addresses = []

    response = await Blockchain.Wallet.importWallet('addresses.bin')
    assert(response === true, 'Error importing addresses!')
    assert(addresses.length === Blockchain.Wallet.addresses.length, 'Addresses length differ after import: ' + addresses.length + '!==' + Blockchain.Wallet.addresses.length)

    for (let i = 0; i < addresses.length; ++i) {
      assert(addresses[i].address.toString() === Blockchain.Wallet.addresses[i].address.toString(), 'Addresses differ after import:' + addresses[i].address + '!==' + Blockchain.Wallet.addresses[i].address)
    }

    FileSystem.unlinkSync('addresses.bin')
  })

  it('test export/import wallet address from/to string', async () => {
    let len = Blockchain.Wallet.addresses.length

    for (let i = 0; i < len; ++i) {
      let address = Blockchain.Wallet.addresses[i].address
      let unencodedAddress = Blockchain.Wallet.addresses[i].unencodedAddress

      let addressString = Blockchain.Wallet.addresses[i].exportAddressToString()
      let blockchainAddress = await Blockchain.Wallet.importAddressFromString(addressString)

      assert(blockchainAddress.address === address, 'Address differ after importing from string: ' + blockchainAddress.address + '!==' + address)
      assert(blockchainAddress.unencodedAddress.equals(unencodedAddress), 'Address differ after importing from string: ' + blockchainAddress.unencodedAddress.toString('hex') + '!==' + unencodedAddress.toString('hex'))
    }
  })

  it('test create Multi Sig public/private Keys', async () => {
    let privateKey1 = MultiSig.createPrivateKey(['datanastere1', 'val', 'pllui'])
    let privateKey2 = MultiSig.createPrivateKey(['datanastere2', 'val', 'pllui'])
    let privateKey3 = MultiSig.createPrivateKey(['datanastere1', 'val', 'pllui'])

    let publicKey1 = MultiSig.getPublicKeyFromPrivate(privateKey1)
    let publicKey2 = MultiSig.getPublicKeyFromPrivate(privateKey2)
    let publicKey3 = MultiSig.getPublicKeyFromPrivate(privateKey3)

    assert(publicKey1.equals(publicKey3), 'Public keys are different')
    assert(!publicKey1.equals(publicKey2), 'Public keys are equal')
  })

  it('test check Mult Sig signature validity', async () => {
    let privateKey = MultiSig.createPrivateKey(['datanastere1', 'plm', 'pllui'])
    let publicKey = MultiSig.getPublicKeyFromPrivate(privateKey)

    let msg = WebDollarCrypto.getBufferRandomValues(32)
    let signedMessage = MultiSig.signMessage(msg, privateKey)

    let response = MultiSig.validateSignedMessage(msg, signedMessage, publicKey)

    assert(response === true, 'Error validating message')
  })

  it('test check encrypt wallet address with 12 words', async () => {
    let passwordZero = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
    let passwordOne = ['ak', 'bv', 'co', 'dy', 're', 'ff', 'sg', 'rh', 'ti', 'sj', 'ck', 'ul']
    let blockchainAddress = await Blockchain.Wallet.createNewAddress()
    let hexAddress = blockchainAddress.address.toString('hex')
    let index = Blockchain.Wallet.getAddress(hexAddress, true)

    assert(index >= 0, 'Address index < 0: index = ' + index)

    response = await Blockchain.Wallet.isAddressEncrypted(hexAddress)
    assert(response === false, 'Address should not be encrypted firstly')

    response = await Blockchain.Wallet.encryptAddress(hexAddress, passwordZero, undefined)
    assert(response === true, 'Error encrypting with first password.')

    response = await Blockchain.Wallet.isAddressEncrypted(hexAddress)
    assert(response === true, 'Address should be encrypted after encryptAddress')

    response = await Blockchain.Wallet.encryptAddress(hexAddress, passwordOne, passwordZero)
    assert(response === true, 'Error encrypting with second password.')
  })

  /* it('test check multiSig public/private Keys', async () => {

        let pair = MultiSig.makeMultisigAddress(['datanastere1','val','pllui']);

        console.log("pair", pair.address);
    }); */
})
