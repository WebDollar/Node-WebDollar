import InterfaceBlockchainFork from '../blockchain/forks/Interface-Blockchain-Fork'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import global from 'consts/global'
import consts from 'consts/const_global'
import StatusEvents from 'common/events/Status-Events'
import BufferExtended from 'common/utils/BufferExtended'
import BansList from 'common/utils/bans/BansList'

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver {
  constructor (blockchain, protocol) {
    this.blockchain = blockchain
    this.protocol = protocol

    this.curentIterationsDownloaded = 0
  }

  async _discoverForkBinarySearch (socket, initialLeft, left, right) {
    let answer

    try {
      let mid = Math.trunc((left + right) / 2)

      answer = await socket.node.sendRequestWaitOnce('head/chainHash', mid, mid, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

      console.log('_discoverForkBinarySearch', initialLeft, 'left', left, 'right ', right, (answer && answer.hash) ? answer.hash.toString('hex') : 'no remote hash', 'my chain hash', (await this.blockchain.getChainHash(mid)).toString('hex'))

      if (left < 0 || !answer || !Buffer.isBuffer(answer.hash)) // timeout
      { return { position: null, header: answer } }

      // i have finished the binary search
      if (left >= right) {
        // it the block actually is the same
        if (answer.hash.equals(await this.blockchain.getChainHash(mid))) { return { position: mid, header: answer.hash } } else {
          // it is not a match, but it was previously a match
          if (mid - 1 >= 0 && initialLeft <= mid - 1 && initialLeft < left) {
            answer = await socket.node.sendRequestWaitOnce('head/chainHash', mid - 1, mid - 1, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

            if (!answer || !Buffer.isBuffer(answer.hash)) { return { position: null, header: answer } } // timeout

            if (answer.hash.equals(await this.blockchain.getChainHash(mid - 1))) // it is a match
            { return { position: mid - 1, header: answer.hash } }
          }

          return { position: -1, header: answer.hash }
        }
      }

      // was not not found, search left because it must be there
      if (!answer.hash.equals(await this.blockchain.getChainHash(mid))) { return await this._discoverForkBinarySearch(socket, initialLeft, left, mid) } else
      // was found, search right because the fork must be there
      { return await this._discoverForkBinarySearch(socket, initialLeft, mid + 1, right) }
    } catch (exception) {
      console.error('_discoverForkBinarySearch raised an exception', exception, answer)

      return { position: null, header: null }
    }
  }

  async _calculateForkBinarySearch (socket, forkChainStartingPoint, forkChainLength, currentBlockchainLength) {
    if (forkChainStartingPoint > currentBlockchainLength - 1 || currentBlockchainLength === 0) { return { position: -1, header: null } } else {
      let binarySearchResult = await this._discoverForkBinarySearch(socket, forkChainStartingPoint, forkChainStartingPoint, currentBlockchainLength - 1)

      // forcing the binary search for download the next unmatching element
      if (binarySearchResult.position !== -1 && binarySearchResult.position + 1 < forkChainLength) { binarySearchResult.position++ }

      return binarySearchResult
    }
  }

  /*
        may the fork be with you Otto
     */

  async discoverFork (socket, forkChainLength, forkChainStartingPoint, forkLastChainHash, forkProof, forkChainWork) {
    let binarySearchResult = { position: -1, header: null }
    let currentBlockchainLength = this.blockchain.blocks.length

    let fork, forkFound

    try {
      let answer = this.blockchain.forksAdministrator.findFork(socket, forkLastChainHash, forkProof)
      if (answer) return answer

      let forkChainHash = {}
      forkChainHash[ forkLastChainHash.toString('hex') ] = true

      fork = await this.blockchain.forksAdministrator.createNewFork(socket, undefined, undefined, undefined, undefined, forkChainHash, false)

      // veify last n elements
      const count = 6

      if (currentBlockchainLength >= count && (forkChainLength >= currentBlockchainLength || (this.blockchain.agent.light && forkProof))) {
        let errors = 0
        for (let i = currentBlockchainLength - 1; i >= currentBlockchainLength - 1 - count && errors < 3; i--) {
          if (i === forkChainLength - 1 && forkLastChainHash) {
            answer = { hash: forkLastChainHash }
          } else {
            answer = await socket.node.sendRequestWaitOnce('head/chainHash', i, i, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)
            if (!answer || !answer.hash) {
              errors++
              continue
            }
          }

          forkFound = this.blockchain.forksAdministrator.findForkyByChainHash(answer.hash)

          if (forkFound && forkFound !== fork) {
            if (Math.random() < 0.01) console.error('discoverAndProcessFork - fork already found by n-2')

            // this lead to a new fork
            for (let key in fork.forkChainHashes) { forkFound.forkChainHashes[key] = true }

            forkFound.pushSocket(socket, forkProof)

            this.blockchain.forksAdministrator.deleteFork(fork) // destroy fork

            return { result: true, fork: forkFound }
          }

          fork.forkChainHashes[ answer.hash.toString('hex') ] = true

          let chainHash = await this.blockchain.getChainHash(i)
          if (chainHash.equals(answer.hash)) {
            binarySearchResult = {
              position: (i === currentBlockchainLength - 1) ? currentBlockchainLength : i + 1,
              header: answer.hash
            }

            break
          }
        }
      }

      // in case it was you solved previously && there is something in the blockchain

      // Binary Search to detect the Fork Position
      if (binarySearchResult.position === -1) {
        if (this.blockchain.agent.light) {
          if (forkChainLength - forkChainStartingPoint > consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS) {
            console.warn('LIGHT CHANGES from ', forkChainStartingPoint, ' to ', forkChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1)
            forkChainStartingPoint = forkChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1
          }
        }

        console.warn('discoverFork 6666' + forkChainStartingPoint)

        binarySearchResult = await this._calculateForkBinarySearch(socket, forkChainStartingPoint, forkChainLength, currentBlockchainLength)

        if (binarySearchResult.position === null) { throw { message: 'connection dropped discoverForkBinarySearch' } }

        forkFound = this.blockchain.forksAdministrator.findForkyByChainHash(binarySearchResult.header)

        if (forkFound && forkFound !== fork) {
          if (Math.random() < 0.01) console.error('discoverAndProcessFork - fork already found by hash after binary search')

          forkFound.forkChainHashes[ forkLastChainHash.toString('hex') ] = true
          forkFound.pushSocket(socket, forkProof)

          this.blockchain.forksAdministrator.deleteFork(fork) // destroy fork

          return { result: true, fork: forkFound }
        }

        if (binarySearchResult.header) { fork.forkChainHashes[binarySearchResult.header.toString('hex')] = true }
      }

      // process light and NiPoPow
      await this.optionalProcess(socket, binarySearchResult, currentBlockchainLength, forkChainLength, forkChainStartingPoint)

      // its a fork... starting from position
      console.log('fork position', binarySearchResult.position, 'forkChainStartingPoint', forkChainStartingPoint, 'forkChainLength', forkChainLength)

      if (binarySearchResult.position === -1 || (binarySearchResult.position > 0 && binarySearchResult.header)) {
        if (binarySearchResult.position === -1) { binarySearchResult.position = 0 }

        // maximum blocks to download
        if (!this.blockchain.agent.light && forkChainLength >= this.blockchain.blocks.length + consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD) {
          fork.downloadAllBlocks = true
          forkChainLength = Math.min(forkChainLength, this.blockchain.blocks.length + consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD)
        }

        if ((forkChainLength - binarySearchResult.position) >= consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD_TO_USE_SLEEP) { fork.downloadBlocksSleep = true }

        fork.forkStartingHeight = binarySearchResult.position
        fork.forkChainStartingPoint = forkChainStartingPoint
        fork.forkChainLength = forkChainLength
        fork.forkChainWork = forkChainWork

        if (fork.forkStartingHeight > fork.forkChainLength - 1) { throw { message: 'FORK is empty' } }

        await fork.validateForkImmutability()

        console.info('initialize fork')
        await fork.initializeFork() // download the requirements and make it ready

        if (!fork.forkReady) { throw { message: ' FORK IS NOT READY ' } }
      } else {
        // it is a totally new blockchain (maybe genesis was mined)
        console.log('fork is something new')
        throw { message: 'fork is something new', binarySearchResult: binarySearchResult, forkChainStartingPoint: forkChainStartingPoint, forkChainLength: forkChainLength }
      }

      return { result: true, fork: fork }
    } catch (exception) {
      this.blockchain.forksAdministrator.deleteFork(fork)

      console.error('discoverAndProcessFork', exception)

      let bIncludeBan = true

      if (this.blockchain.agent.light) {
        if ([ 'FORK is empty', 'fork is something new',
          'discoverAndProcessFork - fork already found by socket',
          'same proof, but your blockchain is smaller than mine', 'Your proof is worse than mine because you have the same block', 'fork proof was already downloaded' ].indexOf(exception.message) >= 0) { bIncludeBan = false }
      }

      if (bIncludeBan) {
        console.warn('BANNNNNNNNNNNNNNNNN', socket.node.sckAddress.toString(), exception.message)
        BansList.addBan(socket, 180000, exception.message)
      }

      await this.blockchain.sleep(10)

      return { result: false, error: exception }
    }
  }

  async optionalProcess (socket, binarySearchResult, currentBlockchainLength, forkChainLength, forkChainStartingPoint) {

  }

  /**
     * Solve Fork by Downloading  the blocks required in the fork
     * @param fork
     * @returns {Promise.<boolean>}
     */
  async _solveFork (fork) {
    StatusEvents.emit('agent/status', { message: 'Collecting Blockchain', blockHeight: fork.forkStartingHeight })

    if (!fork) { throw { message: 'fork is null' } }

    let nextBlockHeight = fork.forkStartingHeight

    // maybe it was deleted before
    if (fork.sockets.length === 0 || !fork.forkReady) { return false }

    console.log(' < fork.forkChainLength', fork.forkChainLength, 'fork.forkBlocks.length', fork.forkBlocks.length)

    let blocksAlreadyHave = 0
    while ((fork.forkStartingHeight + fork.forkBlocks.length < fork.forkChainLength) && !global.TERMINATED) {
      // let socketListOptimized = fork.sockets.sort((a,b) => {return (a.latency > b.latency) ? 1 : ((b.latency > a.latency ) ? -1 : 0);} );

      StatusEvents.emit('agent/status', { message: 'Synchronizing - Downloading Block', blockHeight: nextBlockHeight, blockHeightMax: fork.forkChainLength })

      let onlyHeader

      if (this.protocol.acceptBlocks) { onlyHeader = false } else
      if (this.protocol.acceptBlockHeaders) { onlyHeader = true }

      let answer

      let howManyBlocks = Math.min(fork.forkChainLength - (fork.forkStartingHeight + fork.forkBlocks.length), consts.SETTINGS.PARAMS.CONCURRENCY_BLOCK_DOWNLOAD_MINERS_NUMBER)
      let downloadingList = {}; let trialsList = {}
      let alreadyDownloaded = 0
      let resolved = false

      let finished = new Promise((resolve) => {
        let downloadingBlock = async (index) => {
          try {
            if (trialsList[index] > 10 || global.TERMINATED) {
              if (!resolved) {
                resolved = true
                resolve(false)
              }

              return false
            }

            if (!trialsList[index]) trialsList[index] = 0
            trialsList[index]++

            let socketIndex = Math.floor(Math.random() * fork.sockets.length)
            let socket = fork.getForkSocket(socketIndex)

            if (!socket) {
              // try again
              if (!resolved) return downloadingBlock(index)
              return
            }

            let waitingTime = socket.latency === 0 ? consts.SETTINGS.PARAMS.MAX_ALLOWED_LATENCY : (socket.latency + Math.random() * 2000)

            answer = socket.node.sendRequestWaitOnce('blockchain/blocks/request-block-by-height', { height: nextBlockHeight + index }, nextBlockHeight + index, Math.min(waitingTime, consts.SETTINGS.PARAMS.MAX_ALLOWED_LATENCY))

            answer.then(result => {
              if (!result) {
                socket.latency += Math.floor(Math.random() * 1500)
                if (!resolved) return downloadingBlock(index)
              } else {
                // no answer, let's try again
                if (!result.result) {
                  if (!resolved) return downloadingBlock(index)
                } else if (!downloadingList[index]) {
                  alreadyDownloaded++
                  downloadingList[index] = result

                  if (((alreadyDownloaded === howManyBlocks) || global.TERMINATED) && !resolved) {
                    resolved = true
                    resolve(true)
                  }
                }
              }
            }).catch((exception) => {
              if (!resolved) return downloadingBlock(index)
            })
          } catch (exception) {
            if (!resolved) return downloadingBlock(index)
          }
        }

        console.info('Downloading Blocks...', howManyBlocks)

        for (let i = 0; i < howManyBlocks; i++) {
          if (!downloadingList[i]) { downloadingBlock(i) }
        }
      })

      try {
        await finished
      } catch (exception) {
        console.error('Downloading blocks raised an error', exception)
        resolved = true
        finished = false
      }

      // verify if all blocks were downloaded

      let blockValidation
      let block

      for (let i = 0; i < howManyBlocks; i++) {
        if (!downloadingList[i]) { throw { message: 'block never received ' + nextBlockHeight } }

        if (!downloadingList[i].result || !downloadingList[i].block || !Buffer.isBuffer(downloadingList[i].block)) {
          console.error('Fork Answer received ', downloadingList[i])
          throw { message: 'Fork Answer is not Buffer' }
        }

        blockValidation = fork._createBlockValidation_ForkValidation(nextBlockHeight, fork.forkBlocks.length - 1)
        block = await this._deserializeForkBlock(fork, downloadingList[i].block, nextBlockHeight, blockValidation)

        if (fork.downloadBlocksSleep && nextBlockHeight % 10 === 0) { await this.blockchain.sleep(15) }

        if (this.blockchain.blocks.length > block.height) {
          let hashChain = await this.blockchain.getChainHash(block.height)
          if (hashChain.equals(block.hashChain)) {
            if (blocksAlreadyHave > 10) { throw { message: 'You gave me a block which I already have the same block' } }

            blocksAlreadyHave += 1

            if (fork.forkStartingHeight === nextBlockHeight) {
              nextBlockHeight++
              fork.forkStartingHeight++
            }

            continue
          }
        }

        let result

        try {
          result = await fork.includeForkBlock(block)
        } catch (Exception) {
          console.error('Error including block ' + nextBlockHeight + ' in fork ', Exception)
          throw { message: 'fork.includeForkBlock returned an exception', Exception }
        }

        fork.forkChainHashes[block.hash.toString('hex')] = true

        // if the block was included correctly
        if (result) {
          if (nextBlockHeight % 10 === 0) { console.log('Block ' + nextBlockHeight + ' successfully downloaded!') }

          nextBlockHeight++
        } else { throw { message: "Fork didn't work at height ", nextBlockHeight } }

        if (fork.downloadBlocksSleep && nextBlockHeight % 10 === 0) await this.blockchain.sleep(15)
      }
    }

    if (fork.forkStartingHeight + fork.forkBlocks.length >= fork.forkChainLength) {
      if (await fork.saveFork()) { return true } else { throw { message: "Save Fork couldn't be saved" } }
    }
  }

  async _deserializeForkBlock (fork, blockData, blockHeight, validationBlock) {
    let block

    try {
      block = await this.blockchain.blockCreator.createEmptyBlock(blockHeight, validationBlock)

      if (!this.protocol.acceptBlocks && this.protocol.acceptBlockHeaders) { block.data._onlyHeader = true } // avoiding to store the transactions

      block.deserializeBlock(blockData, blockHeight, undefined, await validationBlock.getDifficultyCallback(blockHeight - 1))
    } catch (Exception) {
      console.error('Error deserializing blocks ', Exception, blockData)
      return false
    }

    return block
  }
}

export default InterfaceBlockchainProtocolForkSolver
