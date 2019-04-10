import consts from 'consts/const_global'
import PPoWHelper from '../helpers/PPoW-Helper'
import PPowBlockchainProofPi from './proofs/PPoW-Blockchain-Proof-Pi'
import PPowBlockchainProofXi from './proofs/PPoW-Blockchain-Proof-Xi'

import PPoWBlockchainProvesCalculated from './PPoW-Blockchain-Proves-Calculated'

class PPoWBlockchainProver {
  constructor (blockchain) {
    this.provesCalculated = new PPoWBlockchainProvesCalculated(blockchain)
    this.proofActivated = true

    this.blockchain = blockchain
    this.proofPi = undefined
    this.proofXi = undefined
  }

  /**
     * Algorithm 3
     * will create Proofs ( π χ )
     *
     * create prover
     */

  async _createProofPi (chain) {
    return

    // B ← C[0]
    let B = await chain.getBlock(0)

    // π
    // π is underlyingChain

    let underlyingChain = new PPowBlockchainProofPi(this.blockchain, [])

    let chainLength = chain.blocks.length

    try {
      console.info('_createProofPi ProofPi CREATOR')
      let count = 0

      // for µ = |C[−k].interlink| down to 0 do

      let C = await chain.getBlock(chainLength - consts.POPOW_PARAMS.k)

      if (chainLength - consts.POPOW_PARAMS.k >= 0) {
        for (let miu = C.interlink.length; miu >= 0; --miu) {
        // α ← C[: −k]{B :}↑µ
        // α is superChain
          let superChain = new PPowBlockchainProofPi(this.blockchain, [])

          // C[: −k]{B :}
          for (let level = miu; level < 256; level++) {
          // C[: −k] ↑µ
            let chainBlocks = this.provesCalculated.levels[level]

            // {B :}
            let index = this.provesCalculated._binarySearch(chainBlocks, B.height)

            for (let i = index; i < chainBlocks.length; i++) {
              if (chainBlocks[i] < (chainLength - consts.POPOW_PARAMS.k) && chainBlocks[i] >= B.height) {
                superChain.push(chainBlocks[i])

                // π ← π ∪ α
                if (!underlyingChain.blocksIndex[ chainBlocks[i] ]) { underlyingChain.push(chainBlocks[i]) }
              }
            }
          }

          // TODO keep the superChain.blocks already sorted and insert it using binary search

          superChain.blocks.sort((a, b) => a - b)

          // if goodδ,m(C, α, µ)
          if (PPoWHelper.good(underlyingChain, superChain, miu)) { B = await this.blockchain.getBlock(superChain.blocks[superChain.blocks.length - consts.POPOW_PARAMS.m]) }

          count++
          if (count % 100 === 0) { await this.blockchain.sleep(5) }
        }
      }

      console.info('_createProofPi ProofPi FINAL')
    } catch (exception) {
      console.error('_createProofPi', exception)
      underlyingChain = null
    }

    if (underlyingChain) {
      underlyingChain.blocks.sort((a, b) => a - b)

      await underlyingChain.calculateProofHash()
      await underlyingChain.calculateProofSerialized()
      await underlyingChain.calculateProofGzip()

      // underlyingChain.proofGzip = undefined;
      // underlyingChain.date = new Date().getTime();
    }

    // let s = "";
    // for (let i=0; i<underlyingChain.blocks.length; i++)
    //     s += underlyingChain.blocks[i].height + " ";
    //
    // console.log("underlyingChain", s);

    return underlyingChain
  }

  _createProofXi (chain) {
    // χ ← C[−k : ]
    let blocks = []
    for (let i = chain.blocks.length - consts.POPOW_PARAMS.k; i < chain.blocks.length; i++) {
      if (i >= 0) { blocks.push(chain.blocks[i]) }
    }

    let proofXi = new PPowBlockchainProofXi(this.blockchain, blocks)

    return proofXi
  }

  async createProofs () {
    if (!this.proofActivated) { return false }

    if (this.proofPi) { this.proofPi = undefined }

    console.info('Creating proof: ', this.blockchain.blocks.length)

    this.proofPi = await this._createProofPi(this.blockchain)

    // this.proofXi = this._createProofXi(this.blockchain);

    // if (consts.DEBUG)
    //     if (this.proofPi !== undefined && this.proofXi !== null)
    //         this.blockchain.verifier.validateChain(this.proofPi, this.proofXi);
  }
}

export default PPoWBlockchainProver
