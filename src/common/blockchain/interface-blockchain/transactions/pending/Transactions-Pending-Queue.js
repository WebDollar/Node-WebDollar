import consts from 'consts/const_global'
import TransactionsProtocol from '../protocol/Transactions-Protocol'
import TransactionsPendingQueueSavingManager from './Transactions-Pending-Queue-Saving-Manager'
import StatusEvents from 'common/events/Status-Events'
import NodesList from 'node/lists/Nodes-List'

class TransactionsPendingQueue {
  constructor (transactions, blockchain, db) {
    this.transactionsProtocol = new TransactionsProtocol(blockchain)

    this.transactions = transactions
    this.pendingQueueSavingManager = new TransactionsPendingQueueSavingManager(blockchain, this, db)

    this.blockchain = blockchain
    this.listObject = {}
    this.listArray = []

    this.db = db

    StatusEvents.on('blockchain/blocks-count-changed', async (data) => {
      if (NodesList.isConsensus(this.blockchain.blocks.length)) { await this._removeOldTransactions() }
    })
  }

  _addNewTransaction (index, transaction) {
    let foundMissingNonce = this.transactionsProtocol.transactionsDownloadingManager.findMissingNonce(transaction.from.addresses[0].unencodedAddress, transaction.nonce)

    if (foundMissingNonce) { this.transactionsProtocol.transactionsDownloadingManager.removeMissingNonceList(transaction.from.addresses[0].unencodedAddress, transaction.nonce) }

    if (index === undefined) { this.listArray.push(transaction) } else { this.listArray.splice(index, 0, transaction) }

    let txId = transaction.txId.toString('hex')

    this.listObject[txId] = transaction
    this.listObject[txId].alreadyBroadcasted = false
  }

  async includePendingTransaction (transaction, exceptSockets, avoidValidation = false) {
    if (this.findPendingTransaction(transaction.txId)) { return false }

    let blockValidationType = {
      'take-transactions-list-in-consideration': {
        validation: true
      }
    }

    if (!avoidValidation) {
      if (!transaction.validateTransactionOnce(this.blockchain.blocks.length - 1, blockValidationType)) { return false }
    }

    await this._insertPendingTransaction(transaction, exceptSockets)

    return true
  }

  analyseMissingNonce (i) {
    let alreadyPropagated = 0

    if (this.transactionsProtocol.transactionsDownloadingManager._transactionsQueueLength < 10) {
      if (this.listArray[i + 1]) {
        if (this.listArray[i + 1].nonce - this.listArray[i].nonce > 1) {
          for (let j = this.listArray[i].nonce + 1; j < this.listArray[i + 1].nonce; j++) {
 if (this.listArray[j] && this.listArray[j].from.addresses[0].unencodedAddress.compare(this.listArray[i].from.addresses[0].unencodedAddress) === 0 && alreadyPropagated <= 5) {
            this.propagateMissingNonce(this.listArray[i].from.addresses[0].unencodedAddress, j)
            alreadyPropagated++
          } 
} 
}
      }
    }
  }

  async _insertPendingTransaction (transaction, exceptSockets) {
    try {
      if (!await this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction)) { throw { message: 'Transsaction validation failed' } }

      // This is just for pool
      // TODO remove on light consensus
      if (this.blockchain.agent.light) {
        if (transaction.timeLock < this.blockchain.blocks.length - 1) { throw { message: 'transaction is too old' } }
      }

      let inserted = false

      for (let i = 0; i < this.listArray.length; i++) {
        let compare = transaction.from.addresses[0].unencodedAddress.compare(this.listArray[i].from.addresses[0].unencodedAddress)

        if (compare < 0) // next
        { continue } else if (compare === 0) { // order by nonce
          if (transaction.nonce === this.listArray[i].nonce) {
            inserted = true
            break
          } else if (transaction.nonce < this.listArray[i].nonce) { // will add a smaller nonce
            this._addNewTransaction(i, transaction)
            inserted = true
            i++
          }
        } else if (compare > 0) { // i will add a higher nonce
          this._addNewTransaction(i, transaction)
          inserted = true
          i++

          this.propagateTransaction(this.listObject[transaction.txId.toString('hex')], exceptSockets)
        }

        if (inserted) {
          if (this.listArray[i].from.addresses[0].unencodedAddress.compare(this.listArray[i - 1].from.addresses[0].unencodedAddress) === 0) {
            if (this.listArray[i].nonce - this.listArray[i - 1].nonce === 1) {
              this.propagateTransaction(this.listObject[transaction.txId.toString('hex')], exceptSockets)

              // Propagate all tx after solving nonce gap
              for (let j = this.listArray[i].nonce; j < this.listArray.length - 1; j++) {
                if (this.listArray[j + 1].from.addresses[0].unencodedAddress.compare(this.listArray[j].from.addresses[0].unencodedAddress) === 0) {
                  if (this.listArray[j + 1].nonce - this.listArray[j].nonce === 1) { this.propagateTransaction(this.listObject[transaction.txId.toString('hex')], exceptSockets) } else { this.analyseMissingNonce(j) }
                } else { break }
              }
            } else { this.analyseMissingNonce(i - 1 >= 0 ? i - 1 : i) }
          }

          break
        }
      }

      if (!inserted) {
        this._addNewTransaction(undefined, transaction)
        this.propagateTransaction(this.listObject[transaction.txId.toString('hex')], exceptSockets)
      }

      transaction.confirmed = false
      transaction.pendingDateBlockHeight = this.blockchain.blocks.length - 1

      await this.transactions.emitTransactionChangeEvent(transaction, true)
    } catch (e) {
      console.error('insertPendingTransaction - ', e)
    }
  }

  findPendingTransaction (txId) {
    return this.listObject[ txId.toString('hex') ]
  }

  findPendingTransactionByAddressAndNonce (address, searchedNonce) {
    if (this.blockchain.accountantTree.getAccountNonce(address) + consts.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_MISSING_NONCE_SEARCH > searchedNonce) { return false }

    let selected; let Left = 0; let Right = this.listArray.length; let compare
    if (this.listArray.length) {
      let selectedTwice = false
      let searchedNonceIsSmaller

      // Binary search for address
      while (Left <= Right) {
        selected = Math.floor((Left + Right) / 2)
        if (selected !== this.listArray.length) { compare = this.listArray[selected].from.addresses[0].unencodedAddress.compare(address) } else { return false }

        if (selectedTwice !== selected) selectedTwice = selected
        else {
          console.warn('missing nonce - not found address in binary search', address)
          return false
        }

        if (compare === 0) { break }
        if (compare > 0) { Left = selected + 1 }
        if (compare < 0) { Right = selected - 1 }
      }

      if (selected === 0) {
        if (this.listArray[selected].from.addresses[0].unencodedAddress.compare(address) !== 0) { return false }
      }

      let closerSelected

      if (this.listArray[selected].nonce > searchedNonce) { closerSelected = selected - (this.listArray[selected].nonce - searchedNonce) } else { closerSelected = selected + (searchedNonce - this.listArray[selected].nonce) }

      if (this.listArray[closerSelected] && this.listArray[closerSelected].from.addresses[0].unencodedAddress.compare(address) === 0);
      selected = closerSelected

      if (this.listArray[selected] && this.listArray[selected].nonce === searchedNonce) { return this.listArray[selected].txId } else { searchedNonceIsSmaller = this.listArray[selected].nonce > searchedNonce }

      let stop = false

      for (let i = selected; !stop; searchedNonceIsSmaller ? i-- : i++) {
        if (searchedNonceIsSmaller) {
          if (i < 0) return false
        } else if (!searchedNonceIsSmaller) {
          if (i => this.listArray.length) return false
        }

        if (this.listArray[i].from.addresses[0].unencodedAddress.compare(address) === 0) {
          if (this.listArray[i].nonce === searchedNonce) {
            return this.listArray[i].txId
          } else {
            if (this.listArray[i].nonce > searchedNonce) {
              if (searchedNonceIsSmaller) continue
              else break
            } else if (this.listArray[i].nonce < searchedNonce) {
              if (searchedNonceIsSmaller) continue
            }
          }
        } else {
          return false
        }
      }
    }

    return false
  }

  async removePendingTransaction (transaction, index) {
    if (typeof index !== 'number') {
      for (let i = 0; i < this.listArray.length; i++) {
        if (this.listArray[i].txId.equals(transaction.txId)) {
          index = i
          break
        }
      }
    }

    if (this.listObject[transaction.txId.toString('hex')]) {
      delete this.listObject[transaction.txId.toString('hex')]

      this.listArray.splice(index, 1)

      await this.transactions.emitTransactionChangeEvent(transaction, true, true)
    }
  }

  async _removeOldTransactions () {
    for (let i = this.listArray.length - 1; i >= 0; i--) {
      let tx = this.listArray[i]

      let removeThis = false

      try {
        if (!tx.blockchain) {
          console.log(tx.txId.toString('hex'), "don't has blockchain")
          removeThis = true
        } else
        if (tx.from.addresses[0].unencodedAddress.equals(this.blockchain.mining.unencodedMinerAddress) && await this.blockchain.mining.miningTransactionSelector.validateTransactionId(tx.txId)) {
          console.log(tx.txId.toString('hex'), 'is mine')
          continue
        } else
        // This is just for pool
        // TODO remove on light consensus
        if (this.blockchain.agent.light && tx.timeLock < this.blockchain.blocks.length - 1) {
          console.log(tx.txId.toString('hex'), 'browser remove')
          removeThis = true
        } else
        if (!await this.blockchain.mining.miningTransactionSelector.validateTransaction(tx)) {
          console.log(tx.txId.toString('hex'), 'not valid anymore')
          removeThis = true
        }
      } catch (exception) {
        console.log(tx.txId.toString('hex'), 'exception remove', exception)

        if (exception.myNonce) {
          if (Math.abs(exception.myNonce - exception.nonce) < consts.SPAM_GUARDIAN.MAXIMUM_DIFF_NONCE_ACCEPTED_FOR_QUEUE) {
            if (!removeThis) { continue }
          }
        }

        removeThis = true
      }

      if (removeThis) { await this.removePendingTransaction(tx, i) } else { console.log(tx.txId.toString('hex'), '------- GOOD tx') }
    }

    console.warn('Transactions stack -', this.listArray.length, 'after removing old')
  }

  propagateTransaction (transaction, exceptSocket) {
    if (this.listObject[transaction.txId.toString('hex')].alreadyBroadcasted) { return false } else {
      this.listObject[transaction.txId.toString('hex')].alreadyBroadcasted = true
      this.transactionsProtocol.propagateNewPendingTransaction(transaction, exceptSocket)
    }
  }

  propagateMissingNonce (addressBuffer, nonce) {
    if (nonce > this.blockchain.accountantTree.getAccountNonce(addressBuffer)) {
      let found = this.transactionsProtocol.transactionsDownloadingManager.findMissingNonce(addressBuffer, nonce)
      if (found) return

      this.transactionsProtocol.propagateNewMissingNonce(addressBuffer, nonce)
      this.transactionsProtocol.transactionsDownloadingManager.addMissingNonceList(addressBuffer, nonce)
    }
  }
}

export default TransactionsPendingQueue
