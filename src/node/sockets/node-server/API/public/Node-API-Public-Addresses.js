import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import WebDollarCoins from 'common/utils/coins/WebDollar-Coins'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import Blockchain from 'main-blockchain/Blockchain'

class NodeAPIPublicAddresses {
  // Get Address
  // TODO: optimize or limit the number of requests

  async addressInfo (req, res) {
    let address = req.address

    try {
      address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address)
    } catch (exception) {
      return { result: false, message: 'Invalid Address' }
    }

    let answer = []
    let minedBlocks = []
    let balance
    let last_block = Blockchain.blockchain.blocks.length

    // Get balance
    balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined)
    balance = balance ? (balance / WebDollarCoins.WEBD) : 0

    // Get mined blocks and transactions
    for (let i = 0; i < Blockchain.blockchain.blocks.length; i++) {
      let block = await Blockchain.blockchain.getBlock(i)
      for (let j = 0; j < block.data.transactions.transactions.length; j++) {
        let transaction = block.data.transactions.transactions[j]

        let found = false
        for (let q = 0; q < transaction.from.addresses.length; q++) {
          if (transaction.from.addresses[q].unencodedAddress.equals(address)) {
            found = true
            break
          }
        }

        for (let q = 0; q < transaction.to.addresses.length; q++) {
          if (transaction.to.addresses[q].unencodedAddress.equals(address)) {
            found = true
            break
          }
        }

        if (found) {
          answer.push({
            blockId: await block.height,
            timestamp: await block.timeStamp + BlockchainGenesis.timeStamp,
            transaction: transaction.toJSON()
          })
        }
      }

      if (block.data.minerAddress.equals(address)) {
        minedBlocks.push({
          blockId: block.height,
          timestamp: block.timeStamp + BlockchainGenesis.timeStamp,
          transactions: block.data.transactions.transactions.length
        })
      }
    }

    return { result: true,
      last_block: last_block,
      balance: balance,
      minedBlocks: minedBlocks,
      transactions: answer
    }
  }

  addressBalance (req, res) {
    let address = req.address

    try {
      address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address)
    } catch (exception) {
      return { result: false, message: 'Invalid Address' }
    }

    try {

    } catch (exception) {

    }
    let balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined)

    return { result: true, balance: !balance ? 0 : (balance / WebDollarCoins.WEBD) }
  }

  addressNonce (req, res) {
    let address = req.address

    try {
      address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address)
    } catch (exception) {
      return { result: false, message: 'Invalid Address' }
    }

    let nonce = Blockchain.blockchain.accountantTree.getAccountNonce(address, undefined)

    return { result: true, nonce: !nonce ? 0 : nonce }
  }
}

export default new NodeAPIPublicAddresses()
