import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import PPoWBlockchainBlockData from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block-Data'
import Blockchain from 'main-blockchain/Blockchain'
import consts from 'consts/const_global'
var assert = require('assert')

describe('test PPoW-Blocks save/load/remove to/from local storage', () => {
  let db = new InterfaceSatoshminDB()
  let version = consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION
  let hash = new Buffer('7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd30ca', 'hex')
  let interlinkHash1 = new Buffer('7bb3e84e6892c7e76be2beedb94a1035b7f095d70b5462806b92be0cbccd30cb', 'hex')
  let interlinkHash2 = new Buffer('7bb3e84e1234c7e76be2beedb94a5678b7f095d50b5462806b92be0cbccd30cc', 'hex')
  let hashPrev = new Buffer('7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa', 'hex')
  let hashChainPrev = new Buffer('7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa', 'hex')
  let timeStamp = Math.trunc(Math.random() * 100000)
  let nonce = Math.trunc(Math.random() * 1000)
  let minerAddress = BlockchainGenesis.minerAddress
  let data = new PPoWBlockchainBlockData(Blockchain.blockchain, minerAddress, [], undefined, undefined) // it will compute the hashData
  let height = Math.trunc(Math.random() * 100000)
  let block = null
  let h1 = 0; let h2 = 1

  let response = null

  it('save/load/remove ppow-block to local storage, sample test', async () => {
    let interlink = [{ height: h1, blockId: interlinkHash1 }, { height: h2, blockId: interlinkHash2 }]

    block = new PPoWBlockchainBlock(Blockchain.blockchain, Blockchain.blockchain.createBlockValidation(), version, hash, hashPrev, hashChainPrev, timeStamp, nonce, data, height, db)
    block.interlink = interlink

    response = await block.saveBlock()
    assert(response === true, 'save: ' + response)

    response = await block.loadBlock()
    assert(response === true, 'load: ' + response)

    assert(block.version === version, 'ppow-block version differ after load: ' + block.version + '!==' + version)
    assert(block.hash.equals(hash), 'ppow-block hash differ after load: ' + block.hash.toString('hex') + '!==' + hash.toString('hex'))
    assert(block.hashPrev.equals(hashPrev), 'ppow-block hashPrev differ after load: ' + block.hashPrev.toString('hex') + '!==' + hashPrev.toString('hex'))
    assert(block.data.equals(data), 'ppow-block.data differ after load: ' + block.data.toString() + '!==' + data.toString())
    assert(block.timeStamp === timeStamp, 'ppow-block timeStamp differ after load: ' + block.timeStamp + '!==' + timeStamp)
    assert(block.nonce === nonce, 'ppow-block nonce differ after load: ' + block.nonce + '!==' + nonce)
    assert(block.data.minerAddress.toString() === data.minerAddress.toString(), 'ppow-block data.minerAddress differ after load: ' + block.data.minerAddress + '!==' + data.minerAddress)
    assert(block.height === height, 'ppow-block height differ after load: ' + block.height + '!==' + height)

    let i = 0

    block.interlink.forEach((link) => {
      assert(link.height === interlink[i].height, 'PPoW Block height differ ' + link.height + '!==' + interlink[i].height)
      assert(link.blockId.equals(interlink[i].blockId), 'PPoW Block blockId  differ ' + link.blockId + '!==' + interlink[i].blockId)

      i++
    })

    response = await block.removeBlock()
    assert(response === true, 'remove: ' + response)

    response = await block.removeBlock()
    assert(response !== true, 'remove: ' + response)
  })

  it('remove ppow-block from local storage, sample test', async () => {
    let interlink = [{ height: h1, blockId: interlinkHash1 }, { height: h2, blockId: interlinkHash2 }]

    block = new PPoWBlockchainBlock(Blockchain.blockchain, Blockchain.blockchain.createBlockValidation(), version, hash, hashPrev, hashChainPrev, timeStamp, nonce, data, height, db)
    block.interlink = interlink

    response = await block.saveBlock()
    assert(response === true, 'save: ' + response)

    response = await block.removeBlock()
    assert(response === true, 'remove: ' + response)

    response = block.loadBlock()
    assert(response !== true, 'load: ppow-block was found after remove. ' + response)

    response = block.loadBlock()
    assert(response !== true, 'load: ppow-block was found after remove. ' + response)

    response = block.loadBlock()
    assert(response !== true, 'load: ppow-block was found after remove. ' + response)
  })
})
