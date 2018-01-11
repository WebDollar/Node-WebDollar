import InterfaceBlockchainBlock from "../../../common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block";

var assert = require('assert')

import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import MiniBlockcainBlock from 'common/blockchain/mini-blockchain/blocks/Mini-Blockchain-Block'
import MiniBlockcain from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'

describe('test PPoW-Blockchain interlink data structure', () => {

    let blockchain = null;
    let response = null;

    it('test blockchain ppow interlink', async () => {

        blockchain = new MiniBlockcain();

        //values are optained from mining simulation :)
        let serialized = [
                "01a7164a6eb2eb9f8d20b4366fed39ab07d46e290e01a2140fbb90d177284b830000008a00017bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa0007500ff6c0c80471ddff3c5b176ec8ad0447b87626e314cfe587e193effd75c476043eabbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456f10db1a01b2e8aab1e7a79aab25285577f10f0666e88daba63ee1bb364479a1301000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "012732a59b138ed3e01bb13f9c450b681e7adb6da81dc2f9544e84fd890e99980000003b000101a7164a6eb2eb9f8d20b4366fed39ab07d46e290e01a2140fbb90d177284b830007500f2f243eaf29ddd70ed5f5d9222936b36670962939fc09957b862b3310e7575bd5abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456bb551471275b3e82811c1519c2eefb16282cce81979a3703beb85c6447ee59c401000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "00ba1378fb038fdcd62aee6a7336231866247e77b9b7ef450fd1f5826b7b73f60000003e0001012732a59b138ed3e01bb13f9c450b681e7adb6da81dc2f9544e84fd890e99980007500f257e6fadd16d1b36f32d2bb5e1a77b2f8fef6f6ec51c67052e39e83defefdbb3abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94569a7ca6a3a4482838f49355a6a7e2fa7727d566ef7fc959042e7c16aa778260ee01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "016bdca04630b460e7303dcbdd36b399f19336dacaf7d15d306d51ea484a15c3000000c3000100ba1378fb038fdcd62aee6a7336231866247e77b9b7ef450fd1f5826b7b73f60007500f8dbb1d4366b9489aa3cc0bbec59772c27e664d43e6c76bcd9de0f630ed7761c4abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945649325f7af52ea60d66cd538baccedfd9ad000cdddc5b7e79ec3a1f5b065562dd01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "00dfb6747fa074e9fd18c21f4cbbaef88dabe724b38b0f4ad939175e84556077000000670001016bdca04630b460e7303dcbdd36b399f19336dacaf7d15d306d51ea484a15c300075010e6ee24759cc6eb0a7e745eaa44a1991c091ea9f3699c8ef110235ae6b73036e3abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945666ac4f30c54d6adf4f659403d40614d351bfa5a3d500f1b96ef639090aa5c65101000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "024b1352bfc828d91b59e133c5bcdd479cf37b6250839ee5cd4eaf55dd25bbdf0000006f000100dfb6747fa074e9fd18c21f4cbbaef88dabe724b38b0f4ad939175e8455607700075010e628214fbe5a291e8822515431b8afd6f80d210bbfb7b860eb21047b2fc5a99cabbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94563e93ee6f168054451a37fe98c80a7c1e96b3fafb3366f4545bb1604feddc8dfa01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "012098051acac7e43af9948013a32ce3e0cea9e8bbb3f2864c39e7155ca39218000000110001024b1352bfc828d91b59e133c5bcdd479cf37b6250839ee5cd4eaf55dd25bbdf00075010715da984b82276a90fe5cd23762f0671e837d470658d03871c0a9c1e1da443a6abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456849ea604058ec5cb2b8719162ca850c45ccc6dc12f8c85513bfa651521d5c19e01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "013f5174f1b52c20f0bf584e6404521b2e473062e4fe467cd979c89d75af9b680000004f0001012098051acac7e43af9948013a32ce3e0cea9e8bbb3f2864c39e7155ca3921800075010b5ec34a1e2966256697225e1909e1e913ffc7a7e2345a53e463a2f7c6247818babbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456a6ff8a70adce9d5c52c33f12e859f30cce93db4f08d65fa2f908f5164e1ed94c01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                "01342a2ef8d16060abb3de45f23d756bed2f682926543e685c6526979e93d444000000310001013f5174f1b52c20f0bf584e6404521b2e473062e4fe467cd979c89d75af9b68000750100bf09b1aa081371b703edde05982c8fc589b56aaa332d35e9023daf34bb4223fabbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94568ffc07ab8b93fadea3bd0f27a0f16fa2efa0da6e5b91e28b2007231d715a3fb401000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",

            ];

        //create a dummy block and deserialize from serialized array
        
        for (let i = 0; i < serialized.length; ++i) {

            let block = new MiniBlockcainBlock( blockchain, 0x01, new Buffer(consts.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKS_POW_LENGTH), undefined, undefined, undefined, i, blockchain.db );
            let buffer = new Buffer(serialized[i], 'hex');

            block.deserializeBlock(buffer);

            await blockchain.includeBlockchainBlock(block, undefined, undefined, false);
        }

        //check if links point correctly
        for (let i = 0; i < blockchain.blocks.length; ++i){
            let block = blockchain.blocks[i];
            console.log('interlink=', block.interlink);
            
            assert(block.interlink[0].height === -1, "Genesis height !== -1, height=" + block.interlink[0].height);
            assert(block.interlink[0].blockId.equals(BlockchainGenesis.hashPrev), "Genesis hash differ. " + block.interlink[0].blockId.toString('hex') + "!==" + BlockchainGenesis.hashPrev.toString('hex'));

            for (let j = 1; j < block.interlink.length; ++j){
                let link = block.interlink[i];
                let prevBlock = blockchain.blocks[link.height];
                assert(prevBlock.hash.equals(link.blockId), "prevHash differ:" + prevBlock.hash.toString('hex') + "!==" + link.blockId.toString('hex'));
            }
        }

    });

});
