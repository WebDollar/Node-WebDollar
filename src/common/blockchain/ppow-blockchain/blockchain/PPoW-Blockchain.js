import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'

/**
 * PPoWBlockchain contains a chain of blocks based on Proof of Proofs of Work
 */
class PPoWBlockchain extends InterfaceBlockchain {


    constructor (protocol){

        super(protocol);
    }

}

export default PPoWBlockchain;