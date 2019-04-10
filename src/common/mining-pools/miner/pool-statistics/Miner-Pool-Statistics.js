import AdvancedEmitter from 'common/utils/Advanced-Emitter'

class MinerPoolStatistics {
  constructor (minerPoolManagement) {
    this.emitter = new AdvancedEmitter(100)

    this.minerPoolManagement = minerPoolManagement

    this._poolHashes = 0
    this._poolMinersOnline = 0
    this._poolBlocksBeingConfirmed = 0
    this._poolBlocksConfirmed = 0
    this._poolBlocksConfirmedAndPaid = 0
    this._poolBlocksUnconfirmed = 0
    this._poolTimeRemaining = 0
  }

  set poolHashes (newValue) {
    if (this._poolHashes === newValue) return

    this._poolHashes = newValue
    this._emitNotification()
  }

  get poolHashes () {
    return this._poolHashes
  }

  set poolMinersOnline (newValue) {
    if (this._poolMinersOnline === newValue) return

    this._poolMinersOnline = newValue
    this._emitNotification()
  }

  get poolMinersOnline () {
    return this._poolMinersOnline
  }

  set poolBlocksConfirmed (newValue) {
    if (this._poolBlocksConfirmed === newValue) return

    this._poolBlocksConfirmed = newValue
    this._emitNotification()
  }

  get poolBlocksConfirmed () {
    return this._poolBlocksConfirmed
  }

  set poolBlocksConfirmedAndPaid (newValue) {
    if (this._poolBlocksConfirmedAndPaid === newValue) return

    this._poolBlocksConfirmedAndPaid = newValue
    this._emitNotification()
  }

  get poolBlocksConfirmedAndPaid () {
    return this._poolBlocksConfirmedAndPaid
  }

  set poolBlocksBeingConfirmed (newValue) {
    if (this._poolBlocksBeingConfirmed === newValue) return

    this._poolBlocksBeingConfirmed = newValue
    this._emitNotification()
  }

  get poolBlocksBeingConfirmed () {
    return this._poolBlocksBeingConfirmed
  }

  set poolBlocksUnconfirmed (newValue) {
    if (this._poolBlocksUnconfirmed === newValue) return

    this._poolBlocksUnconfirmed = newValue
    this._emitNotification()
  }

  get poolBlocksUnconfirmed () {
    return this._poolBlocksUnconfirmed
  }

  set poolTimeRemaining (newValue) {
    if (this._poolTimeRemaining === newValue) return

    this._poolTimeRemaining = newValue
    this._emitNotification()
  }

  get poolTimeRemaining () {
    return this._poolTimeRemaining
  }

  _emitNotification () {
    this.emitter.emit('miner-pool/statistics/update', { poolHashes: this._poolHashes,
      poolMinersOnline: this._poolMinersOnline,
      poolBlocksBeingConfirmed: this._poolBlocksBeingConfirmed,
      poolBlocksConfirmed: this._poolBlocksConfirmed,
      poolBlocksConfirmedAndPaid: this._poolBlocksConfirmedAndPaid,
      poolBlocksUnconfirmed: this._poolBlocksUnconfirmed,
      poolTimeRemaining: this.poolTimeRemaining
    })
  }
}

export default MinerPoolStatistics
