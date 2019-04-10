import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver'
import PPowBlockchainProtocolForkSolver from 'common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol-Fork-Solver'
import consts from 'consts/const_global'
import StatusEvents from 'common/events/Status-Events'
import Serialization from 'common/utils/Serialization'
const BigInteger = require('big-integer')

let inheritForkSolver

if (consts.POPOW_PARAMS.ACTIVATED) inheritForkSolver = PPowBlockchainProtocolForkSolver
else inheritForkSolver = InterfaceBlockchainProtocolForkSolver

class MiniBlockchainLightProtocolForkSolver extends inheritForkSolver {
  async _getLastBlocks (socket, heightRequired) {
    let hash = await socket.node.sendRequestWaitOnce('head/chainHash', heightRequired, heightRequired, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

    if (!hash) { throw { message: 'LightProtocolForkSolver _calculateForkBinarySearch headers-info dropped ', heightRequired } }

    return { position: heightRequired, header: hash.hash }
  }

  async _calculateForkBinarySearch (socket, forkChainStartingPoint, forkChainLength, currentBlockchainLength) {
    console.log('newChainStartingPoint', forkChainStartingPoint, 'forkChainLength', forkChainLength, 'currentBlockchainLength', currentBlockchainLength)

    if (forkChainStartingPoint > currentBlockchainLength - 1) {
      return await this._getLastBlocks(socket, forkChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1)
    } else {
      let result = await inheritForkSolver.prototype._calculateForkBinarySearch.call(this, socket, forkChainStartingPoint, forkChainLength, currentBlockchainLength)

      console.warn('_calculateForkBinarySearch', result)

      if (this.blockchain.agent.light) {
        if (result.position === -1) { return await this._getLastBlocks(socket, forkChainStartingPoint) }
      }

      return result
    }
  }

  async _calculateBlockRequestsForLight (socket, fork) {
    /**

         12...21
         0..... 7, 8,          9,  10,  11, [12, 13, 14, 15, 16, 17, 18,   19,      20, 21 ]
         diff1        	  diff2                                        diff3

         For 11: I need 0,1,2,3,4,5,6,7,8,9,10, 11,

         -----------------------------------------------

         18...28
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, [18,   19,   20, 21, 22, 23, 24, 25, 26, 27, 28]
         diff1        	  diff2                                          diff3

         For 18: I need 0, 1, 2,3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ,13,14,15,16,17

         ------------------------------------------------

         19...29
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   [19,   20, 21, 22, 23, 24, 25, 26, 27, 28, 29 ]
         diff1        	  diff2                                         diff3

         For 19: I need 10, 11, 12 ,13,14,15,16,17,18,

         ------------------------------------------------

         20...30
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   [20, 21, 22, 23, 24, 25, 26, 27, 28, 29 30 ]
         diff1        	  diff2                                         diff3

         For  20: I need 10, 11, 12 ,13,14,15,16,17,18, 19

         -----------------------------------------------

         21...31
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   20, [ 21, 22, 23, 24, 25, 26, 27, 28, 29 30  31]
         diff1        	  diff2                                         diff3

         For  21: I need 10, 11, 12 ,13,14,15,16,17,18, 19, 20

         -----------------------------------------------

         28...38
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   20, 21, 22, 23, 24, 25, 26, 27, [ 28, 29     30  31 32 33 34 35 36 37 38]
         diff1        	  diff2                                         diff3 					     diff4

         For 28: I need 10, 11, 12 ,13,14,15,16,17,18, 19, 20, 21 22 23 24 25 26 27 28

         -----------------------------------------------

         29...39
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   20, 21, 22, 23, 24, 25, 26, 27, 28, [29         30 31 32 33 34 35 36 37 38 39] 40
         diff1        	  diff2                                         diff3 					                    diff4

         For 29: I need 20,21,22,23,24,25,26,27,28

         -----------------------------------------------

         [30...40]

         19     20 21 22 23 24 25 26 27 28  29       [30 31 32 33 34 35 36 37 38  39     40]
         diff3                              diff4		                 diff5

         For 30: I need: 20,21,22,23,24,25,26,27,28,29

         */

    let forkPosition = fork.forkStartingHeight
    let forkAdditionalBlocksBlocksRequired = []

    for (let i = forkPosition - (forkPosition + 1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS; i < forkPosition; i++) { forkAdditionalBlocksBlocksRequired.push(i) }

    // downloading the difficulty for the first element
    let blockFirstPosition = forkAdditionalBlocksBlocksRequired[0]
    let answer = await socket.node.sendRequestWaitOnce('get/blockchain/light/get-light-settings', { height: blockFirstPosition + 1 }, blockFirstPosition + 1, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

    if (!answer) throw { message: 'get-accountant-tree[0] never received ', height: (blockFirstPosition + 1) }
    if (!answer.result) throw { message: 'get-accountant-tree[0] return false ', answer: answer.message }

    if (!answer.result) throw { message: 'get-light-settings return false ', answer: answer.message }
    if (!answer.difficultyTarget) throw { message: 'get-light-settings difficultyTarget is null' }

    return {
      difficultyAdditionalBlocks: forkAdditionalBlocksBlocksRequired,
      difficultyAdditionalBlockFirstDifficulty: answer.difficultyTarget,
      difficultyCalculationStarts: forkPosition - (forkPosition + 1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS
    }
  }

  async _solveFork (fork) {
    let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)]

    // download the new Accountant Tree, in case there is a new fork and I don't have anything in common
    console.warn(' fork.forkChainStartingPoint ' + fork.forkChainStartingPoint + '  ' + 'fork.forkStartingHeight ' + fork.forkStartingHeight + ' length ' + fork.forkChainLength)

    if (fork.forkChainStartingPoint === fork.forkStartingHeight) {
      // light solutions requires more blocks
      fork.forkDifficultyCalculation = await this._calculateBlockRequestsForLight(socket, fork)

      fork.forkStartingHeight = fork.forkDifficultyCalculation.difficultyAdditionalBlocks[0]
      fork.forkChainStartingPoint = fork.forkDifficultyCalculation.difficultyAdditionalBlocks[0]

      // downloading the accountant tree
      StatusEvents.emit('agent/status', { message: 'Downloading Accountant Tree', blockHeight: fork.forkStartingHeight })
      let answer = await this.protocol.getAccountantTree(socket, fork.forkStartingHeight)

      fork.forkPrevAccountantTree = answer.buffer
      fork.forkPrevAccountantTreeGzipped = answer.gzipped

      // Downloading Proof Xi and light settings
      answer = await socket.node.sendRequestWaitOnce('get/blockchain/light/get-light-settings', { height: fork.forkStartingHeight }, fork.forkStartingHeight, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

      if (answer === null) throw { message: 'get-light-settings never received ', forkChainStartingPoint: fork.forkChainStartingPoint }

      if (answer.result === false) throw { message: 'get-light-settings return false ', answer: answer.message }
      if (answer.difficultyTarget === null) throw { message: 'get-light-settings difficultyTarget is null' }
      if (answer.timeStamp === null) throw { message: 'get-light-settings timeStamp is null' }
      if (answer.hashPrev === null) throw { message: 'get-light-settings hashPrev is null' }

      console.log('answer.difficultyTarget', fork.forkStartingHeight, answer.difficultyTarget.toString('hex'))

      fork.forkPrevDifficultyTarget = answer.difficultyTarget
      fork.forkPrevTimeStamp = answer.timeStamp
      fork.forkPrevHash = answer.hash

      // let's download the requested blocks for proving the difficulty
      for (let i = 0; i < fork.forkDifficultyCalculation.difficultyAdditionalBlocks.length; i++) {
        let blockRequested = fork.forkDifficultyCalculation.difficultyAdditionalBlocks[i]

        if (blockRequested % 2 === 0) { StatusEvents.emit('agent/status', { message: 'Synchronizing - Downloading First Blocks', blockHeight: blockRequested, blockHeightMax: fork.forkChainLength }) }

        // TODO it is not necessary to download full blocks, but rather also other nodes will require
        answer = await socket.node.sendRequestWaitOnce('blockchain/blocks/request-block-by-height', { height: blockRequested, onlyHeader: false }, blockRequested, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

        if (!answer) { throw { message: 'block never received ', answer: blockRequested } }

        if (!answer.result || !answer.block || !Buffer.isBuffer(answer.block)) { throw { message: 'block for difficulty never received ', blockRequested: blockRequested } }

        let blockValidation = fork._createBlockValidation_ForkValidation(blockRequested, fork.forkBlocks.length - 1)
        let block = await this._deserializeForkBlock(fork, answer.block, blockRequested, blockValidation)

        if (blockRequested < fork.forkDifficultyCalculation.difficultyCalculationStarts) { block.difficultyTarget = fork.forkDifficultyCalculation.difficultyAdditionalBlockFirstDifficulty }

        try {
          let result = await fork.includeForkBlock(block)

          if (blockRequested === fork.forkDifficultyCalculation.difficultyAdditionalBlocks[0]) { block.difficultyTarget = fork.forkDifficultyCalculation.difficultyAdditionalBlockFirstDifficulty }

          if (!result) { throw { message: 'The block was not includedForkBlock successfully', block: blockRequested } }
        } catch (exception) {
          console.error('Exception including Light Block', exception)
          return false
        }
      }
    } else {
      fork.forkPrevAccountantTree = null
      fork.forkPrevDifficultyTarget = null
      fork.forkPrevTimeStamp = null
      fork.forkPrevHash = null
    }

    return inheritForkSolver.prototype._solveFork.call(this, fork)
  }

  async optionalProcess (socket, binarySearchResult, currentBlockchainLength, forkChainLength, forkChainStartingPoint) {
    if (binarySearchResult.position === -1 && currentBlockchainLength < forkChainLength) {
      let hash = await socket.node.sendRequestWaitOnce('head/chainHash', forkChainStartingPoint, forkChainStartingPoint, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT)

      if (!hash) throw { message: 'connection dropped headers-info optionalProcess' }

      hash = hash.hash

      if (!hash) throw { message: 'connection dropped headers-info optionalProcess' }

      binarySearchResult.position = { position: forkChainStartingPoint, header: hash.hash }
    }

    await inheritForkSolver.prototype.optionalProcess.call(this, socket, binarySearchResult, currentBlockchainLength, forkChainLength, forkChainStartingPoint)
  }
}

export default MiniBlockchainLightProtocolForkSolver
