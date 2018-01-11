import InterfaceBlockchainBlock from "../../../common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block";

var assert = require('assert')

import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import consts from 'consts/const_global'

describe('test PPoW-Blockchain interlink data structure', () => {

    let blockchain = null;
    let response = null;

    it('test blockchain ppow interlink', async () => {

        blockchain = new PPoWBlockchain();

        //values are optained from mining simulation :)
        let serialized = [
                "020ed5f9b38bebe63e9f256b836baeb2603ed79fcf57b7a43d75d782b0271a8a0000002300017bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa000725b5f6c0c80471ddff3c5b176ec8ad0447b87626e314cfe587e193effd75c476043eabbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456f10db1a01b2e8aab1e7a79aab25285577f10f0666e88daba63ee1bb364479a1301000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "027e3550c6fa596615ef2fe7629df61e022895e05dd933695d4ec4fa6a1c23c6000000170001015db817a2474bc5d4b525d13659f8c709d3f8a0e1740386ae5ce9c3e718deca00071e752f243eaf29ddd70ed5f5d9222936b36670962939fc09957b862b3310e7575bd5abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456bb551471275b3e82811c1519c2eefb16282cce81979a3703beb85c6447ee59c401000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "01764bcb058650bd86725f75a34a35faa0a686dd40f27e5b722ca529cb2c937a0000003e0001027e3550c6fa596615ef2fe7629df61e022895e05dd933695d4ec4fa6a1c23c600071e75257e6fadd16d1b36f32d2bb5e1a77b2f8fef6f6ec51c67052e39e83defefdbb3abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94569a7ca6a3a4482838f49355a6a7e2fa7727d566ef7fc959042e7c16aa778260ee01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "0189729dd01d7920876c8338d3082504985da910111520085b66617ab8cc44ee00000036000101764bcb058650bd86725f75a34a35faa0a686dd40f27e5b722ca529cb2c937a00071e758dbb1d4366b9489aa3cc0bbec59772c27e664d43e6c76bcd9de0f630ed7761c4abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945649325f7af52ea60d66cd538baccedfd9ad000cdddc5b7e79ec3a1f5b065562dd01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "01fb288be71e8bff97ba472eddf37779acc304fdf3a52d92b2c77e5acaa0bfbb0000003d00010189729dd01d7920876c8338d3082504985da910111520085b66617ab8cc44ee00071e75e6ee24759cc6eb0a7e745eaa44a1991c091ea9f3699c8ef110235ae6b73036e3abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945666ac4f30c54d6adf4f659403d40614d351bfa5a3d500f1b96ef639090aa5c65101000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "01366ac00e30eb8beef8151e8aeb81d8bb55407e820ef163989e5c348b1ec8470000000a000101fb288be71e8bff97ba472eddf37779acc304fdf3a52d92b2c77e5acaa0bfbb00071e75e628214fbe5a291e8822515431b8afd6f80d210bbfb7b860eb21047b2fc5a99cabbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94563e93ee6f168054451a37fe98c80a7c1e96b3fafb3366f4545bb1604feddc8dfa01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "01bbe629a50c1b575d7c816e9725b95dddfdae7da9d2f4e8da1c74745940e60b00000011000101366ac00e30eb8beef8151e8aeb81d8bb55407e820ef163989e5c348b1ec84700071e75715da984b82276a90fe5cd23762f0671e837d470658d03871c0a9c1e1da443a6abbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456849ea604058ec5cb2b8719162ca850c45ccc6dc12f8c85513bfa651521d5c19e01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "01a44628ed0c5806c02a158643931b78297e5086c211cce82e98f7ec449ea70300000069000101bbe629a50c1b575d7c816e9725b95dddfdae7da9d2f4e8da1c74745940e60b00071e75b5ec34a1e2966256697225e1909e1e913ffc7a7e2345a53e463a2f7c6247818babbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456a6ff8a70adce9d5c52c33f12e859f30cce93db4f08d65fa2f908f5164e1ed94c01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
                // "018121df457f75820941b6a188579d014e50725408431e19b65e34155cd5d9d80000000c000101a44628ed0c5806c02a158643931b78297e5086c211cce82e98f7ec449ea70300071e750bf09b1aa081371b703edde05982c8fc589b56aaa332d35e9023daf34bb4223fabbd370680f3bb09d1aeb162fb1df9017af060b056a6727a42a6dea1bfba5c755df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94568ffc07ab8b93fadea3bd0f27a0f16fa2efa0da6e5b91e28b2007231d715a3fb401000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",

            ];

        //create a dummy block and deserialize from serialized array
        
        for (let i = 0; i < serialized.length; ++i) {
            let block = new PPoWBlockchainBlock( blockchain, 0x01, new Buffer(consts.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 0, blockchain.db );
            let buffer = new Buffer(serialized[i], 'hex');

            console.log("deserializagion111111")
            block.deserializeBlock(buffer);
            console.log("deserializagion222222")
            console.log(block.serializeBlock().toString("hex"));
            console.log("deserializagion3333")
            console.log(block);
            await blockchain.includeBlockchainBlock(block, undefined, undefined, false);
        }

        //check if links point correctly
        for (let i = 0; i < blockchain.blocks.length; ++i){
            let block = blockchain.blocks[i];
            console.log('B.height=', block.height, block.interlink.length);
            for (let j = 0; j < block.interlink.length; ++j){
                let link = block.interlink[i];
                console.log('height=', link.height);
                console.log('blockId=', link.blockId);
                assert(blockchain.blocks[link.height].hash.equals(link.blockId));
            }
        }

    });

});
