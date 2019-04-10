import BufferExtended from './BufferExtended'

const BigInteger = require('big-integer')

class Convert {
  toString (data, base) {
    return data.toString()
  }

  toBufferHex (data, fixedSizeBuffer = true, resultNumBytes = 32) {
    if (typeof data === 'string') { return Buffer.from(data, 'hex') }

    let str = data.toString(16)
    if (str.length % 2 !== 0) { str = '0' + str }

    if (fixedSizeBuffer === true && str.length < 2 * resultNumBytes) {
      let prefix = ''
      for (let i = 0; i < (2 * resultNumBytes - str.length); ++i) { prefix = prefix + '0' }

      str = prefix + str
    }

    return Buffer.from(str, 'hex')
  }

  bufferToBigIntegerHex (data) {
    return new BigInteger(data.toString('hex'), 16)
  }
}

export default new Convert()
