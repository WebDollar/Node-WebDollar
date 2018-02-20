import consts from 'consts/const_global'
import PPoWHelper from './helpers/PPoW-Helper'
import PPowBlockchainProofs from './PPoW-Blockchain-Proofs'
import PPowBlockchainLastBlocks from './PPoW-Blockchain-LastBlocks'

class PPoWBlockchainProver{

    constructor(blockchain, proofs, lastBlocks){

        this.blockchain = blockchain;

        this.proofs = proofs;
        this.lastBlocks = lastBlocks; //last blocks

    }

    /**
     * Algorithm 3
     * will create Proofs ( π χ )
     *
     * create prover
     */

    createProve(chain){

        //B ← C[0]
        let B = chain.blocks[0];

        // π
        let proofs = new PPowBlockchainProofs([]);

        let chainLength =  chain.blocks.length;

        //for µ = |C[−k].interlink| down to 0 do
        for (let miu = chain.blocks[chainLength - consts.POPOW_PARAMS.k].interlink.length - 1; miu >= 0; --miu){

            //  α ← C[: −k]{B :}↑µ
            let alpha = [];
            for (let i = 0; i < chainLength - consts.POPOW_PARAMS.k; ++i)
                if (chain.blocks[i].height >= B.height &&   //C[: −k]{B :}
                    chain.blocks[i].getLevel() >= miu){

                    alpha.push(chain.blocks[i]);
                }

            // π ← π ∪ α
            for (let i = 0; i < alpha.length; ++i)
                proofs.push(alpha[i]);

            //if goodδ,m(C, α, µ)
            if ( this.blockchain.good(alpha, miu) ){
                B = alpha[ alpha.length - consts.POPOW_PARAMS.m ];
            }

        }

        // χ ← C[−k : ]
        let lastBlocks = new PPowBlockchainLastBlocks( chain.blocks.slice(-consts.POPOW_PARAMS.k) );

        this.proofs = proofs;
        this.lastBlocks = lastBlocks;

    }


    /**
     *
     * @param superblock - hi
     * @param regularblock lo
     */
    followDown(superblock, regularblock, blockById ){

        let B = superblock;
        let aux = [];
        let miu = superblock.level;

        while ( B.equals( regularblock ) ){

            // B' ← blockById[B.interlink[µ]]
            let B1 = blockById[B.interlink[miu].height];

            // if depth[B0] < depth[lo] then
            if (B1.height < regularblock.height)
                miu--;
            else {
                aux.push(B);
                B = B1;
            }

        }

        return aux;

    }

    /**
     *
     * @param C
     * @param C1
     */
    proveInfix(C, C1){

        let prove = this.createProve(C);
        let aux = [];

        for (let B1 in C1){

            for (let E in prove.proofs.blocks){

                //if depth[E] ≥ depth[B1] then
                if (E.level >= B1.level){
                    // R ← followDown(E, B0, depth)
                    let R = this.followDown(E, B1, blockById);

                    for (let i = 0; i < R.length; ++i)
                        aux = aux.push(R[i]);

                    break;
                }

                // TODO: What is E1
                let E1 = E;
            }

        }

        // aux ∪ π
        for (let i = 0; i < prove.proofs.blocks.length; ++i)
            aux.push(prove.proofs.blocks[i])

        return new PPoWBlockchainProver(this.blockchain, aux, prove.lastBlocks);

    }






}

export default PPoWBlockchainProver;