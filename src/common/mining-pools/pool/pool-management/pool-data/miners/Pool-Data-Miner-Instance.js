import Serialization from 'common/utils/Serialization'
import consts from 'consts/const_global'
import BufferExtended from 'common/utils/BufferExtended'

class PoolDataMinerInstance {
  constructor (miner, socket) {
    this.miner = miner

    this._hashesPerSecond = 500
    this.socket = socket

    this.work = undefined
    this.lastBlockInformation = undefined

    this._dateActivity = 0
  }

  destroyPoolDataMinerInstance () {
    this.miner = undefined
    this.lastBlockInformation = undefined
    this.work = undefined
    this.socket = undefined
  }

  get address () {
    return this.miner ? this.miner.address : undefined
  }

  get addressWIF () {
    return this.miner.addressWIF
  }

  set hashesPerSecond (newValue) {
    this._hashesPerSecond = newValue
  }

  get hashesPerSecond () {
    return this._hashesPerSecond
  }

  set dateActivity (newValue) {
    this._dateActivity = newValue
  }

  set realHashesPerSecond (newValue) {
    this._realHashesPerSecond = newValue
  }

  get realHashesPerSecond () {
    return this._realHashesPerSecond
  }

  get dateActivity () {
    return this._dateActivity
  }
}

export default PoolDataMinerInstance
