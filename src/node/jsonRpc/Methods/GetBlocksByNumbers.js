import { RpcMethod } from './../../../jsonRpc'
import { defaults, isArray } from 'lodash'

/**
 * Th information about blocks by numbers.
 */
class GetBlocksByNumbers extends RpcMethod {
  constructor (name, oBlockRepository, oBlockTransformer) {
    super(name)
    this._oBlockRepository = oBlockRepository
    this._oBlockTransformer = oBlockTransformer
  }

  async getHandler (args) {
    const oTransformOptions = {
      includeTransactions: args[1] || undefined,
      processHardForks: args[2] || undefined
    }

    if (isArray(args[0]) === false) {
      throw new Error('First parameter must be an Array containing the corresponding block numbers')
    }

    const aBlocks = await this._oBlockRepository.findByNumbers(args[0])
    let aTransformedBlocks = []

    for (const oBlock of aBlocks) {
      aTransformedBlocks.push(await this._oBlockTransformer.transform(oBlock, defaults(oTransformOptions, { includeTransactions: false, processHardForks: true })))
    }

    return aTransformedBlocks
  }
}

export default GetBlocksByNumbers
