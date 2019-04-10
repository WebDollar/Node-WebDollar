import consts from 'consts/const_global'
const argon2 = require('argon2')
// const argon2 = require('./node-argon2-master/');

const HASH_ARGON2_OPTIONS = {
  salt: consts.HASH_ARGON2_PARAMS.saltBuffer,
  timeCost: consts.HASH_ARGON2_PARAMS.time,
  memoryCost: consts.HASH_ARGON2_PARAMS.memBytes,
  parallelism: consts.HASH_ARGON2_PARAMS.parallelism,
  type: consts.HASH_ARGON2_PARAMS.algoNode,
  hashLength: consts.HASH_ARGON2_PARAMS.hashLen
}

class Argon2Node {
  async hash (data) {
    try {
      let options = HASH_ARGON2_OPTIONS
      options.raw = true

      return argon2.hash(data, options)
    } catch (Exception) {
      console.log('Argon2 exception Argon2-Node.hash', Exception.message, Exception.code)

      throw Exception
    }
  }

  async hashString (data) {
    try {
      let options = HASH_ARGON2_OPTIONS
      options.raw = false

      let encoded = await argon2.hash(data, options)

      let hash = encoded.substr(encoded.lastIndexOf('$') + 1)
      hash = hash.substr(hash).substr(hash.lastIndexOf('/') + 1)
      console.log(hash)

      return hash
    } catch (Exception) {
      console.log('Argon2 exception Argon2-Node. hashString', Exception.message, Exception.code)

      throw Exception
    }
  }
}

export default new Argon2Node()
