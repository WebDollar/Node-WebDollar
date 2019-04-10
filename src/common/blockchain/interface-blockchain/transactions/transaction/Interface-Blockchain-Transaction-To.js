import BufferExtended from 'common/utils/BufferExtended'
import Serialization from 'common/utils/Serialization'
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import WebDollarCoins from 'common/utils/coins/WebDollar-Coins'

class InterfaceBlockchainTransactionTo {
  /*
        addresses: [ {
            address: Addr1,
            amount: amount
        }, ... ]
     */

  constructor (transaction, addresses) {
    this.transaction = transaction
    this.setTo(addresses)
  }

  setTo (addresses) {
    if (!addresses) return false

    if (addresses && typeof addresses === 'object' && addresses.addresses) { addresses = addresses.addresses }

    if (!Array.isArray(addresses)) { addresses = [addresses] }

    for (let i = 0; i < addresses.length; i++) {
      if (addresses[i].unencodedAddress) {
        if (typeof addresses[i].unencodedAddress === 'object' && addresses[i].unencodedAddress.unencodedAddress) { addresses[i].unencodedAddress = addresses[i].unencodedAddress.unencodedAddress }

        addresses[i].unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addresses[i].unencodedAddress)
      } else
      if (addresses[i].address) { // maybe address
        addresses[i].unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addresses[i].address)
      }

      if (typeof addresses[i].amount === 'string') { addresses[i].amount = parseInt(addresses[i].amount) }
    }

    this.addresses = addresses
  }

  toJSON () {
    let addresses = []

    for (let address of this.addresses) {
      addresses.push({
        address: BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address.unencodedAddress)),
        amount: address.amount.toString()
      })
    }

    return {
      addresses: addresses
    }
  }

  /**
     * Validate To
     * @param to: object { addresses: [], fee: number, positive, currency: TokenObject ]
     * @returns  to
     */
  validateTo () {
    if (this.addresses.length === 0) throw { message: 'To is empty Array' }

    if (this.addresses.length >= 256) throw { message: 'Too many inputs. Max 256' }

    let index = -1
    for (let toObject of this.addresses) {
      index++

      if (!toObject.unencodedAddress || !Buffer.isBuffer(toObject.unencodedAddress)) { throw { message: 'To.Object Address is not specified', address: toObject, index: index } }

      if (!WebDollarCoins.validateCoinsNumber(toObject.amount)) { throw { message: 'To.Object Amount is not specified', address: toObject, index: index } }

      if (toObject.amount <= 0) { throw { message: 'To.Object Amount is an invalid number', address: toObject, index: index } }

      for (let i = 0; i < this.transaction.from.addresses.length; i++) {
        if (BufferExtended.safeCompare(this.transaction.from.addresses[i].unencodedAddress, toObject.unencodedAddress)) { throw { message: 'To.Object Address is included in the input and it should not be included in output ', address: toObject } }
      }
    }

    // Validate to.currency

    return true
  }

  calculateOutputSum () {
    // validate amount
    let outputValues = []; let outputSum = 0

    for (let i = 0; i < this.addresses.length; i++) {
      outputValues.push(this.addresses[i].amount)
      outputSum += this.addresses[i].amount
    }

    return outputSum
  }

  serializeTo () {
    let addressesBuffer = []

    addressesBuffer.push(Serialization.serializeNumber1Byte(this.addresses.length))

    for (let i = 0; i < this.addresses.length; i++) {
      addressesBuffer.push(Serialization.serializeToFixedBuffer(consts.ADDRESSES.ADDRESS.LENGTH, this.addresses[i].unencodedAddress))
      addressesBuffer.push(Serialization.serializeNumber7Bytes(this.addresses[i].amount))
    }

    return Buffer.concat(addressesBuffer)
  }

  deserializeTo (buffer, offset) {
    try {
      this.addresses = []

      let length = Serialization.deserializeNumber1Bytes(buffer, offset)
      offset += 1

      for (let i = 0; i < length; i++) {
        let address = {}

        address.unencodedAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH)
        offset += consts.ADDRESSES.ADDRESS.LENGTH

        address.amount = Serialization.deserializeNumber7Bytes(buffer, offset)
        offset += 7

        this.addresses.push(address)
      }

      return offset
    } catch (exception) {
      console.error('error deserializing a transaction TO ', exception)
      throw exception
    }
  }

  processTransactionTo (multiplicationFactor = 1, revertActions) {
    // overwritten in Mini Blockchain
  }
}

export default InterfaceBlockchainTransactionTo
