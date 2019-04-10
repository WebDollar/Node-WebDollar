import BufferExtended from './BufferExtended'

const BigNumber = require('bignumber.js')
const BigInteger = require('big-integer')

class Serialization {
  /**
     * @param data
     */
  serializeBigInteger (bigInteger) {
    // converting number value into a buffer

    let list = []
    while (bigInteger.greater(0)) {
      let division = bigInteger.divmod(256)

      list.push(division.remainder)
      bigInteger = division.quotient
    }
    list.reverse()

    let buffer = new Buffer(list.length)

    for (let i = 0; i < list.length; i++) { buffer[i] = list[i] }

    return buffer
  }

  deserializeBigInteger (buffer) {
    let number = new BigInteger(0)

    let power = new BigInteger(1)
    for (let i = buffer.length - 1; i >= 0; i--) {
      number = number.plus(power.multiply(buffer[i]))
      power = power.multiply(256)
    }

    return number
  }

  convertBigNumber (bigNumber, length) {
    // converting number value into a buffer

    let buffer = new Buffer(length)
    let count = length - 1

    while (bigNumber.isGreaterThan(0)) {
      buffer[count] = bigNumber.modulo(256).toNumber()
      bigNumber = bigNumber.dividedToIntegerBy(256)

      count--
    }

    return buffer
  }

  serializeNumber1Byte (data) {
    // converting number value into a buffer
    let buffer = Buffer(1)
    buffer[0] = (data & 0xff)

    return buffer
  }

  serializeNumber2Bytes (data) {
    // converting number value into a buffer
    let buffer = Buffer(2)
    buffer[1] = data & 0xff
    buffer[0] = data >> 8 & 0xff

    return buffer
  }

  serializeNumber3Bytes (data) {
    // converting number value into a buffer
    let buffer = Buffer(3)
    buffer[2] = data & 0xff
    buffer[1] = data >> 8 & 0xff
    buffer[0] = data >> 16 & 0xff

    return buffer
  }

  // converting number value into a buffer
  serializeNumber4Bytes (data) {
    let buffer = Buffer(4)
    buffer[3] = data & 0xff
    buffer[2] = data >> 8 & 0xff
    buffer[1] = data >> 16 & 0xff
    buffer[0] = data >> 24 & 0xff

    return buffer
  }

  // will show the nonce positive
  deserializeNumber4Bytes_Positive (buffer, offset = 0) {
    let value = 0

    for (let i = offset; i <= offset + 3; i++) { value = (value * 256) + buffer[i] }

    return value
  }

  deserializeNumber4Bytes (buffer, offset = 0) {
    return buffer[3 + offset] | (buffer[2 + offset] << 8) | (buffer[1 + offset] << 16) | (buffer[0 + offset] << 24)
  }

  deserializeNumber3Bytes (buffer, offset = 0) {
    return buffer[2 + offset] | (buffer[1 + offset] << 8) | (buffer[0 + offset] << 16)
  }

  deserializeNumber2Bytes (buffer, offset = 0) {
    return buffer[1 + offset] | (buffer[0 + offset] << 8)
  }

  deserializeNumber1Bytes (buffer, offset = 0) {
    return buffer[0 + offset]
  }

  serializeNumber7Bytes (long) {
    // we want to represent the input as a 8-bytes array
    var byteArray = new Buffer(7)

    for (let index = 0; index < byteArray.length; index++) {
      let byte = long & 0xff
      byteArray[ index ] = byte
      long = (long - byte) / 256
    }

    return byteArray
  }

  deserializeNumber7Bytes (buffer, offset = 0) {
    let value = 0

    for (let i = offset + 6; i >= offset; i--) { value = (value * 256) + buffer[i] }

    return value
  }

  deserializeNumber (buffer) {
    if (buffer.length === 1) return buffer[0]; else

    if (buffer.length === 2) return buffer[1] | (buffer[0] << 8); else

    if (buffer.length === 3) return buffer[2] | (buffer[1] << 8) | (buffer[0] << 16); else

    if (buffer.length === 4) return buffer[3] | (buffer[2] << 8) | (buffer[1] << 16) | (buffer[0] << 24); else

    if (buffer.length === 6) return buffer[5] | (buffer[4] << 8) | (buffer[3] << 16) | (buffer[2] << 24) | (buffer[1] << 32) | (buffer[0] << 40)
  }

  /**
     * Convers buffer to a Fixed Length buffer
     * @returns {Buffer}
     */
  serializeToFixedBuffer (noBytes, buffer) {
    if (buffer === undefined || buffer === null) { return new Buffer(noBytes) }
    if (buffer.length === noBytes) // in case has the same number of bits as output
    { return buffer }

    let result = new Buffer(noBytes)

    let c = 0
    for (let i = buffer.length - 1; i >= 0; i--) {
      c++
      result[noBytes - c] = buffer[i]
    }

    return result
  }

  serializeHashOptimized (hash) {
    return this.serializeBufferRemovingLeadingZeros(hash)
  }

  deserializeHashOptimized (buffer, offset) {
    let hashPrefix = []

    let hashLength = this.deserializeNumber1Bytes(buffer, offset)
    offset += 1

    for (let i = 0; i < 32 - hashLength; i++) hashPrefix.push(0)

    let hashLeadingZero = BufferExtended.substr(buffer, offset, hashLength)
    offset += hashLength

    let deserializedHash = Buffer.concat([
      new Buffer(hashPrefix),
      hashLeadingZero
    ])

    let result = {
      hash: deserializedHash,
      offset: offset
    }

    return result
  }

  serializeBufferRemovingLeadingZeros (buffer) {
    let count = 0
    while (count < buffer.length && buffer[count] === 0) { count++ }

    let result = new Buffer(1 + buffer.length - count)
    result[0] = buffer.length - count

    for (let i = count; i < buffer.length; i++) { result[i - count + 1] = buffer[i] }

    return result
  }

  /**
     * Returns the position of most significant bit of 1
     * Eg: for n = 00000000000000000000000000001010 returns 3
     * @returns {number}
     */
  mostSignificantOneBitPosition (n) {
    let num = 0

    if (0xFFFF0000 & n) {
      n = (0xFFFF0000 & n) >> 16
      num += 16
    }
    if (0xFF00 & n) {
      n = (0xFF00 & n) >> 8
      num += 8
    }
    if (0xF0 & n) {
      n = (0xF0 & n) >> 4
      num += 4
    }
    if (12 & n) {
      n = (12 & n) >> 2
      num += 2
    }
    if (2 & n) {
      n = (2 & n) >> 1
      num += 1
    }

    return num
  }

  /**
     * Serialize a Big Number object into an optimal Buffer
     * based on https://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
     */
  serializeBigNumber (data) {
    // 9999999999.99999999999
    // d: [999, 9999999, 9999999, 9999000]
    // d biggest number is 0x5AF3107A3FFF
    // e: 9  - it can also be negative
    // s: 1

    if (data instanceof BigNumber === false) { throw 'data is not big decimal' }
    if (data.c.length === 0) { throw "data is 0 and can't be " }

    let buffer = new Buffer(1 + 1 + data.c.length * 6)

    buffer[0] = Math.abs(data.e) % 128 + (data.e >= 0 ? 0 : 1) * 128
    buffer[1] = data.c.length % 128 + (data.s >= 0 ? 0 : 1) * 128

    for (let i = 0; i < data.c.length; i++) {
      // converting the number to buffer
      let long = data.c[i]; let byte

      byte = long & 0xff
      buffer[2 + (i * 6)] = byte
      long = (long - byte) / 256

      byte = long & 0xff
      buffer[2 + (i * 6 + 1)] = byte
      long = (long - byte) / 256

      byte = long & 0xff
      buffer[2 + (i * 6 + 2)] = byte
      long = (long - byte) / 256

      byte = long & 0xff
      buffer[2 + (i * 6 + 3)] = byte
      long = (long - byte) / 256

      byte = long & 0xff
      buffer[2 + (i * 6 + 4)] = byte
      long = (long - byte) / 256

      byte = long & 0xff
      buffer[2 + (i * 6 + 5)] = byte
      long = (long - byte) / 256
    }

    return buffer
  }

  /**
     * Deserialize a Big Number object from an optimal Buffer
     * based on https://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
     */
  deserializeBigNumber (buffer, offset) {
    offset = offset || 0

    let bigNumber = { e: 0, s: 0, c: [] }

    if (!Buffer.isBuffer(buffer)) { throw "Can't deserialize Big Number because it is not a buffer" }

    bigNumber.e = buffer[0 + offset ] % 128
    bigNumber.e *= Math.floor(buffer[0 + offset] / 128) === 0 ? 1 : -1

    let length = buffer[1 + offset ] % 128
    bigNumber.s = Math.floor(buffer[1 + offset] / 128) === 0 ? 1 : -1

    for (let i = 0; i < length; i++) {
      let nr = 0

      nr = buffer[2 + i * 6 + 5 + offset ]
      nr = (nr * 256) + buffer[2 + i * 6 + 4 + offset ]
      nr = (nr * 256) + buffer[2 + i * 6 + 3 + offset ]
      nr = (nr * 256) + buffer[2 + i * 6 + 2 + offset ]
      nr = (nr * 256) + buffer[2 + i * 6 + 1 + offset ]
      nr = (nr * 256) + buffer[2 + i * 6 + 0 + offset ]

      bigNumber.c.push(nr)
    }

    // console.log("bigNumber", bigNumber);
    let res = new BigNumber(0)
    res.c = bigNumber.c
    res.s = bigNumber.s
    res.e = bigNumber.e

    return {
      number: res,
      newOffset: 2 + length * 6 + offset
    }
  }

  deserializeNumber (buffer) {
    if (buffer.length === 1) return buffer[0]; else

    if (buffer.length === 2) return buffer[1] | (buffer[0] << 8); else

    if (buffer.length === 3) return buffer[2] | (buffer[1] << 8) | (buffer[0] << 16); else

    if (buffer.length === 4) return buffer[3] | (buffer[2] << 8) | (buffer[1] << 16) | (buffer[0] << 24)
  }
}

export default new Serialization()
